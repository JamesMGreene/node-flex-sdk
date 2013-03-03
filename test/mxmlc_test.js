// nodeunit-based Functionality Tests
// tests require an active internet connection

'use strict';

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

fs.existsSync = fs.existsSync || path.existsSync;

var binPath = require('../lib/mxmlc').path;

var safeDelete = function(path) {
  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    }
    catch (err) {
      // Swallow it
    }
  }
};

module.exports = {

  testDownload: function(test) {
    test.expect(1);

    var value = fs.existsSync(binPath);

    test.ok(value, 'should download and extract proper binary');

    test.done();
  },
  
  testCompileSuccess: {
    setUp: function(done) {
      // Delete the binary
      var targetBinary = path.join(__dirname, 'testData', 'testApp.swf');
      safeDelete(targetBinary);
      done();
    },
    tearDown: function(done) {
      // Delete the binary
      var targetBinary = path.join(__dirname, 'testData', 'testApp.swf');
      safeDelete(targetBinary);
      done();
    },
    testIt: function(test) {
      test.expect(4);

      var targetSource = path.join(__dirname, 'testData', 'testApp.as');
      var targetBinary = path.join(__dirname, 'testData', 'testApp.swf');
      
      var childArgs = [
        '+configname=air',
        targetSource
      ];

      childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        var stdoutLower = stdout.toLowerCase();
        var stderrLower = stderr.toLowerCase();
        
        var noFailures = stdoutLower.indexOf('fail') === -1 && stderrLower.indexOf('fail') === -1;
        var noErrors = stdoutLower.indexOf('error') === -1 && stderrLower.indexOf('error') === -1;
        var containsSwfPath;
        // Ignore case for Windows
        if (process.platform === 'win32') {
          containsSwfPath = stdoutLower.indexOf(targetBinary.toLowerCase()) !== -1;
        }
        else {
          containsSwfPath = stdout.indexOf(targetBinary) !== -1;
        }
        
        test.ok(noFailures, 'should compile the target successfully without failures');
        test.ok(noErrors, 'should compile the target successfully without errors');
        test.ok(containsSwfPath, 'should compile the target successfully and show path to output binary');
        test.ok(fs.existsSync(targetBinary), 'compiled output binary should exist');

        test.done();
      });
    }
  },

  testCompileFailure: {
    setUp: function(done) {
      // Delete the binary
      var targetBinary = path.join(__dirname, 'testData', 'errorApp.swf');
      safeDelete(targetBinary);
      done();
    },
    tearDown: function(done) {
      // Delete the binary
      var targetBinary = path.join(__dirname, 'testData', 'errorApp.swf');
      safeDelete(targetBinary);
      done();
    },
    testIt: function(test) {
      test.expect(3);

      var targetSource = path.join(__dirname, 'testData', 'errorApp.as');
      var targetBinary = path.join(__dirname, 'testData', 'errorApp.swf');
      
      var childArgs = [
        '+configname=air',
        targetSource
      ];

      childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        var stdoutLower = stdout.toLowerCase();
        var stderrLower = stderr.toLowerCase();
        
        var hadFailures = stdoutLower.indexOf('fail') !== -1 || stderrLower.indexOf('fail') !== -1;
        var hadErrors = stdoutLower.indexOf('error') !== -1 || stderrLower.indexOf('error') !== -1;
        var containsSwfPath;
        // Ignore case for Windows
        if (process.platform === 'win32') {
          containsSwfPath = stdoutLower.indexOf(targetBinary.toLowerCase()) !== -1;
        }
        else {
          containsSwfPath = stdout.indexOf(targetBinary) !== -1;
        }
        
        test.ok(hadFailures || hadErrors, 'should fail to compile the target with either failures or errors');
        test.ok(!containsSwfPath, 'should not show path to output binary');
        test.ok(!fs.existsSync(targetBinary), 'compiled output binary should not exist');

        test.done();
      });
    }
  }  
};