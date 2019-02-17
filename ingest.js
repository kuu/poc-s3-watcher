const config = require('config');
const fetch = require('node-fetch');
const debug = require('debug')('s3-watcher');

const {
  accountId,
  user,
  pass
} = config.bc;

const profiles = [
  'DD-001',
  'DD-002',
  'DD-013',
  'DD-015',
  'DD-016'
];

function makeRequest(uri, method = 'GET', body, auth) {
  debug(`makeRequest: [${method}] ${uri} ${body}`);
  return fetch(uri, {
    method,
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: auth
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

function getAccessToken() {
  const hash = Buffer.from(`${user}:${pass}`).toString('base64');
  return makeRequest(
    'https://oauth.brightcove.com/v4/access_token',
    'POST',
    'grant_type=client_credentials',
    `Basic ${hash}`
  )
    .then(res => {
      if (!res) {
        return res;
      }
      return res.access_token;
    });
}

function getVideoId(accessToken, name) {
  return makeRequest(
    `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos`,
    'POST',
    JSON.stringify({name}, null, 2),
    `Bearer ${accessToken}`
  )
    .then(res => {
      if (!res) {
        return res;
      }
      return res.id;
    });
}

function launchIngestion(accessToken, videoId, videoURL, profileId) {
  return makeRequest(
    `https://ingest.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/ingest-requests`,
    'POST',
    JSON.stringify({master: {url: videoURL}, profile: profileId}, null, 2),
    `Bearer ${accessToken}`
  );
}

async function ingestVideoFromURL(name, url) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }
  const videoId = await getVideoId(accessToken, name);
  if (!videoId) {
    return null;
  }
  return launchIngestion(accessToken, videoId, url, profiles[0]);
}

module.exports = {
  ingestVideoFromURL
};
