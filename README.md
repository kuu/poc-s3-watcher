# poc-s3-watcher

# Install

```
$ git clone https://github.com/kuu/poc-s3-watcher.git
$ cd poc-s3-watcher
$ npm install
```

# Configure

#AWS SDK
In ~/.aws/credentials
```
[default]
aws_access_key_id = Your-Access-Key-ID
aws_secret_access_key = Your-Secret-Access-Key
```

#App Config
In ./config/default.json
```
{
  "s3": {
    "bucketName": "Amazon S3 Bucket Name",
    "rootPrefix": "Prefix to start traverse",
    "extensionList": [".m2t", ".mp4"],
    "nMinutesBefore": 10
  },
  "flex": {
    "baseUri": "https://platease.apac.ooyala-flex.com/api",
    "workspaceId": 126518,
    "user": "Your Flex User ID",
    "pass": "Your Flex Password",
    "workflowDefinitionId": 126519
  }
}
```
The above example is to detect TS and MP4 files uploaded within 10 minutes

# Run / Stop

```
$ npm start
$ npm stop
```

# Enable logs

```
$ export DEBUG=s3-watcher
$ npm start
$ tail -f error.log
```
