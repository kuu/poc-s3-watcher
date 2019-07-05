const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const {dest} = require('config');
const debug = require('debug')('s3-watcher');

const {file} = dest;

function getDateString(date) {
  return `${date.getFullYear()}-${('00' + (date.getMonth() + 1)).slice(-2)}-${('00' + date.getDate()).slice(-2)}`;
}

function getTimeString(date) {
  return `${('00' + date.getHours()).slice(-2)}:${('00' + date.getMinutes()).slice(-2)}:${('00' + date.getSeconds()).slice(-2)}`;
}

function getDateTimeString() {
  const date = new Date();
  return `${getDateString(date)} ${getTimeString(date)}`;
}

function getFileName() {
  return `${getDateString(new Date())}.log`;
}

function getFilePath() {
  const {root} = file;
  /*
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }
  */

  const filePath = path.join(root, getFileName());
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'time,path,status\n');
  }

  return filePath;
}

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', err => {
        reject(err);
      });
  });
}

function writeCSV(filePath, lines) {
  let str = 'time,path,status\n';
  for (const line of lines) {
    str += `${line.time},${line.path},${line.status}\n`;
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, str, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function notifyIncommingFile(filePath) {
  const csvFilePath = getFilePath();
  debug(`CSV read from ${csvFilePath}`);
  return readCSV(csvFilePath)
    .then(lines => {
      lines.push({time: getDateTimeString(), path: filePath, status: ''});
      debug(`Write CSV to ${csvFilePath}`);
      return writeCSV(csvFilePath, lines);
    })
    .catch(err => {
      console.log(err.stack);
    });
}

module.exports = {
  notifyIncommingFile
};
