/*
 * flex-sdk
 * https://github.com/JamesMGreene/node-flex-sdk
 *
 * Copyright (c) 2013 James M. Greene
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var FLEX_HOME = path.join(__dirname, 'flex_sdk');
var binDir = path.join(FLEX_HOME, 'bin');

var flexSdk = {
  FLEX_HOME: FLEX_HOME,
  binDir: binDir,
  bin: {},
  refresh: function() {
    // Clear any existing bin mapping
    Object.keys(flexSdk.bin).forEach(function(binKey) {
      delete flexSdk.bin[binKey];
    });

    // Add binary executables to the bin mapping
    if (fs.existsSync(flexSdk.binDir)) {
      var files = fs.readdirSync(flexSdk.binDir);
      var winExecFiles = files.filter(function(filename) {
        var ext = filename.slice(-4).toLowerCase();
        return ext === '.bat' || ext === '.exe';
      });
      if (process.platform === 'win32') {
        winExecFiles.forEach(function(binFilename) {
          var binKey = binFilename.slice(0, -4);
          flexSdk.bin[binKey] = path.join(binDir, binFilename);
        });
      }
      else {
        var execFiles = winExecFiles.map(function(binFilename) {
          return binFilename.slice(0, -4);
        });
        execFiles.forEach(function(binFilename) {
          flexSdk.bin[binFilename] = path.join(binDir, binFilename);
        });
      }
    }
  }
};

// Load the initial bin mapping
flexSdk.refresh();

module.exports = flexSdk;