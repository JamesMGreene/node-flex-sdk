/*
 * flex-sdk
 * https://github.com/JamesMGreene/node-flex-sdk
 *
 * Copyright (c) 2013 James M. Greene
 * Licensed under the MIT license.
 */

/*
 * This simply downloads the requested version of the Adobe Flex SDK.
 */

'use strict';

var DEBUG_TRAVIS = false;
var fs = require('fs');
var path = require('path');
fs.existsSync = fs.existsSync || path.existsSync;
var async = require('async');
var download = require('download');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var D2UConverter = require('dos2unix').dos2unix;
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
var downloadUrl = pkgMeta.flexSdk.url;


process.on('uncaughtException', function(err) {
  console.error('FATAL! Uncaught exception: ' + err);
  process.exit(1);
});


function logErrorsToFile(errors, phase) {
  fs.writeFileSync(path.join(__dirname, 'prepublish.log'), JSON.stringify(errors, null, "  "));
  console.error('There were errors during the "' + phase + '"" phase. Check "prepublish.log" for more details!');
}


function cleanDestination(done) {
  if (fs.existsSync(libPath)) {
    rimraf(libPath, function(err) {
      if (err) {
        return done(new Error('Error deleting library path: ' + libPath));
      }
      mkdirp(libPath, done);
    });
  }
  else {
    mkdirp(libPath, done);
  }
}


function downloadIt(done) {
  var notifiedCount = 0;
  var count = 0;
  var notificationChunkSize = 1024 * 1024;

  function onData(data) {
    count += data.length;
    if ((count - notifiedCount) > notificationChunkSize) {
      console.log('Received ' + (count / notificationChunkSize).toFixed(1) + ' MB...');
      notifiedCount = count;
    }
  }

  function onError(err) {
    done(new Error('Error with HTTP request:\n' + err));
  }

  function onClose() {
    console.log('Received ' + count + ' bytes total!');
    done();  // Next!
  }

  function onResponse(response) {
    console.log('Receiving...');

    if (response.statusCode !== 200) {
      done(new Error('Error with HTTP request:\n' + JSON.stringify(response.headers)));
    }
  }


  console.log('Requesting ' + downloadUrl);

  var downloader = download(downloadUrl, libPath, { extract: true });
  downloader
    .on('response', onResponse)
    .on('data', onData)
    .on('error', onError)
    .on('close', onClose);
}


function refreshSdk(done) {
  // Start utilizing the API by refreshing its binary cache
  flexSdk.refresh();

  done();
}


function fixLineEndings(done) {
  console.log('Fixing line endings with the `dos2unix` Node module...');

  // Convert all DOS line endings (CrLf) to UNIX line endings (Lf)
  var d2uOptions = {
    glob: {
      cwd: libPath
    },
    maxConcurrency: 100  /* Only open a max of 100 files at once */
  };
  var conversionEndedAlready = false;
  var errors = [];
  var dos2unix = new D2UConverter(d2uOptions)
    .on('convert.error', function(err) {
      err.type = 'convert.error';
      errors.push(err);
    })
    .on('processing.error', function(err) {
      err.type = 'processing.error';
      errors.push(err);
    })
    .on('error', function(err) {
      console.error('Critical error while fixing line endings:\n' + (err.stack || err));
      if (!conversionEndedAlready) {
        if (errors.length) {
          logErrorsToFile(errors, 'dos2unix');
        }
        return done(new Error('Exiting prematurely...'));
      }
    })
    .on('end', function(stats) {
      conversionEndedAlready = true;
      var err;
      if (errors.length || stats.error > 0) {
        logErrorsToFile(errors, 'dos2unix');
        err = new Error('"dos2unix" processing completed but had errors');
      }
      console.log('dos2unix conversion stats: ' + JSON.stringify(stats));

      // Next!
      done(err);
    });

  // DEBUGGING
  if (DEBUG_TRAVIS) {
    ['start', 'processing.start', 'processing.skip', 'convert.start', 'convert.end', 'processing.end'].forEach(function(e) {
      dos2unix.on(e, function() {
        var args = [].slice.call(arguments, 0);
        console.log('[DEBUG] dos2unix event: ' + JSON.stringify({ 'type': e, 'args': args }, null, '  '));
      });
    });
  }

  dos2unix.process(['**/*']);
}


function fixJavaInvocationsForMac(done) {
  // Cleanup: RegExp stuff for finding and replacing
  var javaInvocationRegex = /^java .*\$VMARGS/m;
  var javaInvocationMatchingRegex = /^(java .*\$VMARGS)/mg;
  var javaInvocationReplacement = [
    'D32=""',
    'D32_OVERRIDE=""',
    'IS_OSX="`uname | grep -i Darwin`"',
    'IS_JAVA64="`java -version 2>&1 | grep -i 64-Bit`"',
    'JAVA_VERSION="`java -version 2>&1 | awk -F \'[ ".]+\' \'NR==1 {print $$3 "." $$4}\'`"',
    'if [ "$$IS_OSX" != "" -a "$$HOSTTYPE" = "x86_64" -a "$$IS_JAVA64" != "" -a "$$JAVA_VERSION" = "1.6" ]; then',
    '  D32_OVERRIDE="-d32"',
    'fi',
    'VMARGS="$$VMARGS $$D32_OVERRIDE"',
    '',
    '$1'
  ].join('\n');


  // Do the cleanup!
  Object.keys(flexSdk.bin).forEach(function(binKey) {
    var binaryPath = flexSdk.bin[binKey];

    // Ensure that the Bash scripts are updated to work with 64-bit JREs on Mac
    var ext = binaryPath.slice(-4).toLowerCase();
    if (ext !== '.bat' && ext !== '.exe') {
      var contents = fs.readFileSync(binaryPath, { encoding: 'utf8' });
      // Rewrite any Java invocations to ensure they work on Mac
      if (contents.match(javaInvocationRegex)) {
        console.log('Fixing Java invocation for MacOSX in: ' + binaryPath);
        var cleanedContents = contents.replace(javaInvocationMatchingRegex, javaInvocationReplacement);
        fs.writeFileSync(binaryPath, cleanedContents, { encoding: 'utf8', mode: '755' });
      }
    }
  });

  done();
}


function fixFilePermissions(done) {
  Object.keys(flexSdk.bin).forEach(function(binKey) {
    var binaryPath = flexSdk.bin[binKey];

    // Ensure that the binaries are user-executable (problems with unzip library)
    var stat = fs.statSync(binaryPath);
    // 64 === 0100 (no octal literal in strict mode)
    if (!(stat.mode & 64)) {
      console.log('Fixing file permissions for: ' + binaryPath);
      fs.chmodSync(binaryPath, '755');
    }
  });

  done();
}


//
// Go!
//
async.series([
    cleanDestination,
    downloadIt,
    refreshSdk,
    fixLineEndings,
    fixJavaInvocationsForMac,
    fixFilePermissions
  ],
  function (err) {
    if (err) {
      console.error(err + '\n');
    }
    else {
      // VICTORY!!!
      console.log('SUCCESS! The Flex SDK binaries are available at:\n  ' + flexSdk.binDir + '\n');
    }
    process.exit(err ? 1 : 0);
  }
);