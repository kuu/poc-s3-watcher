const config = require('config');
const fetch = require('node-fetch');
const debug = require('debug')('s3-watcher');

const {
  baseUri,
  workspaceId,
  user,
  pass,
  workflowDefinitionId
} = config.flex;

const hash = Buffer.from(`${user}:${pass}`).toString('base64');

function makeRequest(uri, method = 'GET', data) {
  const jsonStr = JSON.stringify(data, null, 2);
  debug(`makeRequest: [${method}] ${uri} ${jsonStr}`);
  return fetch(uri, {
    method,
    body: jsonStr,
    headers: {
      'Content-Type': 'application/vnd.nativ.mio.v1+json',
      Authorization: `Basic ${hash}`
    }
  })
    .then(res => {
      if (res.status >= 400) {
        return debug(`${res.status} ${res.statusText} [${method}] ${uri}`);
      }
      return res.json();
    })
    .catch(err => {
      console.error(err.stack);
      return null;
    });
}

function launchNotificationWorkflow(bucketName, incomingFile) {
  return makeRequest(`${baseUri}/workflows`, 'POST', {
    definitionId: workflowDefinitionId,
    workspaceId,
    stringVariables: {
      incomingFile,
      url: `https://s3-ap-northeast-1.amazonaws.com/${bucketName}/${incomingFile}`
    }
  });
}

function checkIfAssetExists(name) {
  return makeRequest(`${baseUri}/assets;workspaceId=${workspaceId};searchText="${encodeURIComponent(name)}"`)
    .then(res => {
      if (!res || !res.assets) {
        debug(`No asset (name = ${name}) found`);
        return false;
      }
      return res.assets.some(asset => asset.name === name);
    });
}

module.exports = {
  launchNotificationWorkflow,
  checkIfAssetExists
};
