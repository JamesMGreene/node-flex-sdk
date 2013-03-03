/*
 * mxmlc-install
 * https://github.com/JamesMGreene/node-mxmlc-install
 *
 * Copyright (c) 2013 James M. Greene
 * Licensed under the MIT license.
 */

/*
 * This simply fetches the requested version of mxmlc (via an Adobe Flex SDK).
 */

'use strict';

var cp = require('child_process');
var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var rimraf = require('rimraf').sync;
var unzip = require('unzip');
var pkgMeta = require('./package.json');

var helper = require('./lib/mxmlc');

fs.existsSync = fs.existsSync || path.existsSync;

var libPath = path.join(__dirname, 'lib', 'flex_sdk');
var tmpPath = path.join(__dirname, 'tmp');

var downloadUrl = pkgMeta.flexSdk.url;
var fileName = downloadUrl.split('/').pop();
var downloadedFile = path.join(tmpPath, fileName);

function mkdir(name) {
  var dir = path.dirname(name);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function getOptions() {
  if (process.env.http_proxy) {
    var options = url.parse(process.env.http_proxy);
    options.path = downloadUrl;
    options.headers = { Host: url.parse(downloadUrl).host };
    return options;
  }
  else {
    return url.parse(downloadUrl);
  }
}

function finishIt(err, stdout, stderr) {
  if (err) {
    console.log('Error extracting archive:\n' + err);
    process.exit(1);
  }
  else {
    // Delete the ZIP file
    fs.unlinkSync(downloadedFile);

    // Move the contents, if there are files left
    var files = fs.readdirSync(tmpPath);
    var wasRenamed = false;
    if (files.length) {
      console.log('Renaming extracted folder -> flex_sdk');
      fs.renameSync(tmpPath, libPath);
      wasRenamed = true;
    }

    // For isolating extraction problems
    if (!wasRenamed) {
      console.log('Temporary files not renamed, maybe zip extraction failed.');
      process.exit(1);
      return;
    }

    // Check that the binary is user-executable and fix it if it isn't (problems with unzip library)
    if (process.platform !== 'win32') {
      var stat = fs.statSync(helper.path);
      // 64 == 0100 (no octal literal in strict mode)
      if (!(stat.mode & 64)) {
        console.log('Fixing file permissions');
        fs.chmodSync(helper.path, '755');
      }
    }

    rimraf(tmpPath);

    console.log('Done. mxmlc binary available at:\n' + helper.path);
  }
}

function extractIt() {
  console.log('Extracting zip contents...');

  var unzipStream = unzip.Extract({ path: path.dirname(downloadedFile) });
  unzipStream.on('error', finishIt);
  unzipStream.on('close', finishIt);

  var readStream = fs.createReadStream(downloadedFile);
  readStream.pipe(unzipStream);
  readStream.on('error', finishIt);
  readStream.on('close', function() { console.log('Read stream closed.'); });
}

function fetchIt() {
  var notifiedCount = 0;
  var count = 0;

  rimraf(tmpPath);
  rimraf(libPath);

  mkdir(downloadedFile);

  var outFile = fs.openSync(downloadedFile, 'w');

  function onData(data) {
    fs.writeSync(outFile, data, 0, data.length, null);
    count += data.length;
    if ((count - notifiedCount) > 800000) {
      console.log('Received ' + Math.floor(count / 1024) + 'KB...');
      notifiedCount = count;
    }
  }

  function onEnd() {
    console.log('Received ' + Math.floor(count / 1024) + 'KB total.');
    fs.closeSync(outFile);
    extractIt();
  }

  function onResponse(response) {
    var status = response.statusCode;
    console.log('Receiving...');

    if (status === 200) {
      response.addListener('data', onData);
      response.addListener('end', onEnd);
    }
    else {
      console.log('Error with HTTP request:\n' + response.headers);
      client.abort();
      process.exit(1);
    }
  }

  var client = http.get(getOptions(), onResponse);
  console.log('Requesting ' + downloadedFile);
}

fetchIt();
