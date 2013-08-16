// nodeunit-based Functionality Tests
// tests require an active internet connection

'use strict';

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

fs.existsSync = fs.existsSync || path.existsSync;

var flexSdk = require('../lib/flex');

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

  testDownloadAndSdkExposure: function(test) {
    test.expect(8);

    test.ok(flexSdk.binDir, 'should have binary directory path set');
    test.ok(fs.existsSync(flexSdk.binDir), 'should have binary directory path equal to an existing item');
    test.ok(fs.statSync(flexSdk.binDir).isDirectory(), 'should have binary directory path equal to an existing DIRECTORY');
    test.ok(flexSdk.bin, 'should have bin mapping object');
    test.ok(Object.keys(flexSdk.bin).length > 0, 'should have at least 1 bin mapping entry');
    test.ok(flexSdk.bin.mxmlc, 'should have bin mapping entry for `mxmlc`');
    test.ok(fs.existsSync(flexSdk.bin.mxmlc), 'should have binary for `mxmlc` equal to an existing item');
    test.ok(fs.statSync(flexSdk.bin.mxmlc).isFile(), 'should have binary for `mxmlc` equal to an existing FILE');

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
      test.expect(8);

      var executable = flexSdk.bin.mxmlc;
      var targetSource = path.join(__dirname, 'testData', 'testApp.as');
      var targetBinary = path.join(__dirname, 'testData', 'testApp.swf');

      var childArgs = [
        '+configname=air',
        targetSource
      ];

      // Hack for non-Windows boxes
      if (process.platform !== 'win32') {
        childArgs.unshift(executable);
        executable = '/bin/sh';
      }

      test.ok(flexSdk.bin.mxmlc, 'should have a path for `mxmlc`');
      test.strictEqual(fs.existsSync(flexSdk.bin.mxmlc), true, '`mxmlc` should exist at the expected path');
      test.strictEqual(fs.existsSync(targetSource), true, 'the target source file should exist');

      childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
        test.equal(err, null, 'should not throw an error while executing the child process' + (err || ''));

        var stdoutLower = stdout.toLowerCase();
        var stderrLower = stderr.toLowerCase();

        var noFailures = stdoutLower.indexOf('fail') === -1 && stderrLower.indexOf('fail') === -1;
        var noErrors = stdoutLower.indexOf('error') === -1 && stderrLower.indexOf('error') === -1;

        var containsSwfPath;
        // Ignore case (and slashes) for Windows
        if (process.platform === 'win32') {
          containsSwfPath = stdoutLower.replace(/\\/gi, '/').indexOf(targetBinary.toLowerCase().replace(/\\/gi, '/')) !== -1;
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

  testCompileFailureDueToSynaxError: {
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
      test.expect(7);

      var executable = flexSdk.bin.mxmlc;
      var targetSource = path.join(__dirname, 'testData', 'errorApp.as');
      var targetBinary = path.join(__dirname, 'testData', 'errorApp.swf');

      var childArgs = [
        '+configname=air',
        targetSource
      ];

      // Hack for non-Windows boxes
      if (process.platform !== 'win32') {
        childArgs.unshift(executable);
        executable = '/bin/sh';
      }

      test.ok(flexSdk.bin.mxmlc, 'should have a path for `mxmlc`');
      test.strictEqual(fs.existsSync(flexSdk.bin.mxmlc), true, '`mxmlc` should exist at the expected path');
      test.strictEqual(fs.existsSync(targetSource), true, 'the target source file should exist');

      childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
        test.notEqual(err, null, 'should throw an error while executing the child process');

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
  },

  testCompileFailureDueToMissingSource: {
    setUp: function(done) {
      // Delete the binary
      var targetBinary = path.join(__dirname, 'testData', 'nonExistentApp.swf');
      safeDelete(targetBinary);
      done();
    },
    tearDown: function(done) {
      // Delete the binary
      var targetBinary = path.join(__dirname, 'testData', 'nonExistentApp.swf');
      safeDelete(targetBinary);
      done();
    },
    testIt: function(test) {
      test.expect(7);

      var executable = flexSdk.bin.mxmlc;
      var targetSource = path.join(__dirname, 'testData', 'nonExistentApp.as');
      var targetBinary = path.join(__dirname, 'testData', 'nonExistentApp.swf');

      var childArgs = [
        '+configname=air',
        targetSource
      ];

      // Hack for non-Windows boxes
      if (process.platform !== 'win32') {
        childArgs.unshift(executable);
        executable = '/bin/sh';
      }

      test.ok(flexSdk.bin.mxmlc, 'should have a path for `mxmlc`');
      test.strictEqual(fs.existsSync(flexSdk.bin.mxmlc), true, '`mxmlc` should exist at the expected path');
      test.strictEqual(fs.existsSync(targetSource), false, 'the target source file should not exist');

      childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
        test.notEqual(err, null, 'should throw an error while executing the child process');

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