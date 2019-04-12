# poc-s3-watcher

# Install

```
$ git clone https://github.com/kuu/poc-s3-watcher.git
$ cd poc-s3-watcher
$ npm install
```

# Configure

## AWS SDK
In ~/.aws/credentials (Windows: C:\Users\USER_NAME\.aws\credentials)
```
[default]
aws_access_key_id = Your-Access-Key-ID
aws_secret_access_key = Your-Secret-Access-Key
```

## App Config
In ./config/default.json
```
{
  "s3": {
    "extensionList": [".m2t", ".mp4"],
    "nMinutesBefore": 10
  },
  "dest": {
    "smtp": {
      "host": "SMTP server's host name or IP address",
      "port": 465,
      "secure": true, // use TLS
      "auth": {
        "user": "User Name",
        "pass": "Password"
      }
    },
    message: {
      "from": "email address",
      "to": [{array of email addresses}],
      "cc": [{array of email addresses}],
      "bcc": [{array of email addresses}]
    }
  }
}
```
The above example is to check all S3 buckets every 10 minutes searching for any newly uploaded TS or MP4 files and, if exists, send an email to the specified SMTP server

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
