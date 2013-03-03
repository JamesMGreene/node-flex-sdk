/*
 * mxmlc-install
 * https://github.com/JamesMGreene/node-mxmlc-install
 *
 * Copyright (c) 2013 James M. Greene
 * Licensed under the MIT license.
 */

var path = require('path');
var binPath = path.join(__dirname, 'flex_sdk', 'bin');

if (process.platform === 'win32') {
  binPath = path.join(binPath, 'mxmlc.exe');
}
else {
  binPath = path.join(binPath, 'mxmlc');
}

module.exports.path = binPath;