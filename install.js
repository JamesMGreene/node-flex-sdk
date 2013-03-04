/*
 * flex
 * https://github.com/JamesMGreene/node-flex
 *
 * Copyright (c) 2013 James M. Greene
 * Licensed under the MIT license.
 */

/*
 * This simply downloads the requested version of the Adobe Flex SDK.
 */

'use strict';

var fs = require('fs');
var path = require('path');
fs.existsSync = fs.existsSync || path.existsSync;
var url = require('url');
var http = require('http');
var cp = require('child_process');
var rimraf = require('rimraf').sync;
var unzip = require('unzip');
var pkgMeta = require('./package.json');

// IMPORTANT:
// This `require` call MUST be done post-download because the export of this 
// module is dynamically created based on the executables present after
// downloading and unzipping the relevant Flex SDK.
// If the `require` call is done prior to the download completing, then the
// module's `refresh` function must be invoked afterward to establish the
// correct list of available binaries.
var flexSdk = require('./lib/flex');


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

    // Start utilizing the API by refreshing its binary cache
    flexSdk.refresh();

    // Ensure that the binaries are user-executable (problems with unzip library)
    if (process.platform !== 'win32') {
      Object.keys(flexSdk.bin).forEach(function(binKey) {
        var binaryPath = path.join(flexSdk.binDir, flexSdk.bin[binKey]);
        var stat = fs.statSync(binaryPath);
        // 64 == 0100 (no octal literal in strict mode)
        if (!(stat.mode & 64)) {
          console.log('Fixing file permissions for: ' + binaryPath);
          fs.chmodSync(binaryPath, '755');
        }
      });
    }

    rimraf(tmpPath);

    console.log('Done. The Flex SDK binaries are available at:\n  ' + flexSdk.binDir);
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
