const config = require('config');
const AWS = require('aws-sdk');
const debug = require('debug')('s3-watcher');

let destModule;

const {dest} = config;

const {
  extensionList,
  nMinutesBefore
} = config.s3;

if (dest.smtp) {
  destModule = require('./smtp');
} else if (dest.file) {
  destModule = require('./file');
}

const {notifyIncommingFile} = destModule;

const THRESHOLD = nMinutesBefore * 60000;

function checkIfNewFile(file, extensionList) {
  const fileName = file.Key;
  if (!extensionList.some(extension => fileName.length === fileName.lastIndexOf(extension) + extension.length)) {
    return false;
  }

  const lastModified = new Date(file.LastModified);
  const currentTime = new Date();
  if (lastModified.getTime() >= currentTime.getTime() - THRESHOLD) {
    // If the file was modified within the specified minutes
    return true;
  }

  return false;
}

function visitDir(s3, prefix, extensionList, updateList) {
  const currentPrefix = prefix.Prefix;
  return s3.listObjects(prefix).promise()
    .then(async ({Contents: list, CommonPrefixes: prefixList}) => {
      debug(`[${currentPrefix}] ---`);
      for (const file of list) {
        const fileName = file.Key;
        if (fileName === currentPrefix) {
          continue;
        }

        debug(JSON.stringify(file, null, 2));

        if (checkIfNewFile(file, extensionList)) {
          debug(`Update found: ${fileName}`);
          updateList.push(`${fileName}`);
        }
      }

      if (!prefixList || prefixList.length === 0) {
        return;
      }

      for (const dir of prefixList) {
        await visitDir(s3, dir, extensionList, updateList);
      }
    })
    .catch(err => {
      console.error(err.stack);
    });
}

function checkUpdated(bucketName) {
  const s3 = new AWS.S3({
    params: {
      Bucket: bucketName,
      Delimiter: '/'
    }
  });
  const updateList = [];
  const root = {Prefix: ''};
  return visitDir(s3, root, extensionList, updateList)
    .then(async () => {
      if (updateList.length > 0) {
        for (const file of updateList) {
          const fileName = `/${bucketName}/${file}`;
          await notifyIncommingFile(fileName);
        }
      }
    });
}

function checkAllBuckets() {
  const s3 = new AWS.S3();
  return s3.listBuckets().promise()
    .then(async ({Buckets: list}) => {
      for (const {Name: bucketName} of list) {
        if (!bucketName.startsWith('ingest-')) {
          continue;
        }

        debug(`Enter bucket: ${bucketName}`);
        await checkUpdated(bucketName);
      }
    });
}

function tick() {
  return checkAllBuckets()
    .then(() => {
      setTimeout(tick, THRESHOLD / 2);
    })
    .catch(err => {
      console.error(err.stack);
      setTimeout(tick, THRESHOLD / 2);
    });
}

setTimeout(tick, 0);
