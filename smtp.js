const nodemailer = require('nodemailer');
const {dest} = require('config');
const debug = require('debug')('s3-watcher');

const smtp = nodemailer.createTransport(dest.smtp);

function createMessageText(filePath) {
  return `
The following file was uploaded:

${filePath}
  `;
}

function notifyIncommingFile(filePath) {
  const msgToSend = Object.assign({
    subject: 'A new file is uploaded!',
    text: createMessageText(filePath)
  }, dest.message);
  debug(`Sending a message: ${JSON.stringify(msgToSend, null, 2)}`);
  return new Promise((resolve, reject) => {
    smtp.sendMail(msgToSend, (err, res) => {
      if (err) {
        console.error(err.stack);
        reject(err);
      } else {
        debug(`A message sent: ${res.message}`);
        resolve(res.message);
      }

      smtp.close();
    });
  });
}

module.exports = {
  notifyIncommingFile
};
