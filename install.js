/*
 * flex-sdk
 * https://github.com/JamesMGreene/node-flex-sdk
 *
 * Copyright (c) 2013 James M. Greene
 * Licensed under the MIT license.
 */

/*
 * This simply corrects the execute permissions on the SDK binaries.
 */

'use strict';

var playerGlobal = require('playerglobal-latest');
var flexSdk = require('./lib/flex');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

// Ensure that the binaries are user-executable (i.e. Linux shell scripts if published from Windows)
if (process.platform !== 'win32') {
  Object.keys(flexSdk.bin).forEach(function(binKey) {
    var binaryPath = flexSdk.bin[binKey];
    var stat = fs.statSync(binaryPath);
    // 64 === 0100 (no octal literal in strict mode)
    if (!(stat.mode & 64)) {
      console.log('Fixing file permissions for: ' + binaryPath);
      fs.chmodSync(binaryPath, '755');
    }
  });
}

var flashApiLibDir = path.join(flexSdk.FLEX_HOME, 'frameworks', 'libs', 'player');
mkdirp(flashApiLibDir, function(err) {
  if (err) {
    console.error('Failed to install the latest "playerglobal.swc" library collection!\nError: ' + err);
    process.exit(1);
  }

  // Copy all of the Flash API libraries into the Flex SDK folder
  playerGlobal.install(flexSdk.FLEX_HOME, function(err) {
    if (err) {
      console.error('Failed to install the latest "playerglobal.swc" library collection!\nError: ' + err);
    }
    else {
      console.log('Successfully installed the latest "playerglobal.swc" library collection.');
    }
    process.exit(err ? 1 : 0);
  });
});