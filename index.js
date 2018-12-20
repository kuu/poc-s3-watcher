const config = require('config');
const AWS = require('aws-sdk');

const {checkIfAssetExists, launchNotificationWorkflow} = require('./launch');

const {
  bucketName,
  rootPrefix,
  extensionList,
  nMinutesBefore
} = config.s3;

const THRESHOLD = nMinutesBefore * 60000;

const s3 = new AWS.S3({
  params: {
    Bucket: bucketName,
    Delimiter: '/'
  }
});

const root = {Prefix: rootPrefix};

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

function visitDir(prefix, extensionList, updateList) {
  const currentPrefix = prefix.Prefix;
  return s3.listObjects(prefix).promise()
    .then(async ({Contents: list, CommonPrefixes: prefixList}) => {
      // console.log(`[${currentPrefix}] ---`);
      for (const file of list) {
        const fileName = file.Key;
        if (fileName === currentPrefix) {
          continue;
        }
        // console.log(JSON.stringify(file, null, 2));
        if (checkIfNewFile(file, extensionList)) {
          updateList.push(`${fileName}`);
        }
      }
      if (!prefixList || prefixList.length === 0) {
        return;
      }
      for (const dir of prefixList) {
        await visitDir(dir, extensionList, updateList);
      }
    })
    .catch(err => {
      console.error(err.stack);
    });
}

function checkUpdated() {
  const updateList = [];
  return visitDir(root, extensionList, updateList)
    .then(async () => {
      if (updateList.length > 0) {
        console.log('Update List:');
        for (const file of updateList) {
          if (await checkIfAssetExists(file)) {
            continue;
          }
          console.log(`\t${file}`);
          await launchNotificationWorkflow(file);
        }
      }
    });
}

function tick() {
  return checkUpdated()
    .then(() => {
      setTimeout(tick, THRESHOLD / 2);
    })
    .catch(err => {
      console.error(err.stack);
      setTimeout(tick, THRESHOLD / 2);
    });
}

setTimeout(tick, 0);
