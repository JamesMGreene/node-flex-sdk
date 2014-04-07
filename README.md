[![Build Status](https://travis-ci.org/JamesMGreene/node-flex-sdk.png)](https://travis-ci.org/JamesMGreene/node-flex-sdk)

# flex-sdk

An NPM wrapper for the [Apache Flex SDK][flex/apache/site] / [Adobe Flex SDK][flex/adobe/site].


## Building and Installing

```shell
npm install flex-sdk
```

Or grab the source and

```shell
npm install .
```

What this is really doing is just grabbing a particular "blessed" (by this
module) version of the Flex SDK.  As new versions of the Apache/Adobe Flex
SDK are released and vetted, this module will be updated accordingly.

The package has been set up to fetch the Flex SDK and run `mxmlc` for MacOS (darwin),
Linux based platforms (as identified by Node.js), and Windows.  If you
spot any platform weirdnesses, let me know or send a patch.


## External Dependencies

If you intend to _use_ this module after it is installed, almost all of the Flex
SDK binary/executable files have an implicit dependency on Java being installed
on the system _and_ that it is available in the `PATH` such that it can be
invoked just by typing the command `java`.


## Running

```shell
bin/mxmlc [mxmlc arguments]
```

Check out the [full list of `mxmlc` command line options][flex/adobe/compiler-options]
for more information.

And npm will install a link to the binary in `node_modules/.bin` as
it is wont to do.


## Running via node

The package exports an object contains:
 - a `binDir` string which is the path to the "bin" directory of the Flex SDK
 - a `bin` object which contains an entry for each executable included in the
   "bin" directory of the Flex SDK (e.g. `flexSdk.bin.mxmlc` will provide the
   path to the `mxmlc` executable).
 - a `refresh` function if you ever need to refresh the `bin` object (e.g. if
   you have an existing `flex-sdk` module reference object but then downloaded a
   new Flex SDK).

Below is an example of using this package via node.

```js
var childProcess = require('child_process');
var flexSdk = require('flex-sdk');
var binPath = flexSdk.bin.mxmlc;

var childArgs = [
  'arguments to pass to mxmlc',
  path.join(__dirname, 'fileToCompile.as')
];

childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
  // handle results
});
```


# Versioning
The NPM package version tracks the version of the Flex SDK that will be installed,
with an additional build number that is used for revisions to the installer
when necessary.

As such, `4.6.0-0`, `4.6.0-1`, and `4.6.0-2` will all install Flex SDK v4.6.0 but each
has newer changes to the installer than the previous.

For the full list of available versions, see [FlexSDKs.md][flex/sdk-versions].


## Purpose
This is an _NPM wrapper_ and can be used to make the various binary executables 
from the Apache/Adobe Flex SDKs (e.g. `mxmlc`) conveniently available.
It is not a Node.js wrapper.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code
using [Grunt][grunt/site].


## Release History
 - Adobe Flex SDK v4.6.0 &rarr; `npm install flex-sdk@~4.6.0`
 - Adobe Flex SDK v4.5.1 &rarr; `npm install flex-sdk@~4.5.1`
 - Adobe Flex SDK v4.5.0 &rarr; `npm install flex-sdk@~4.5.0`
 - Adobe Flex SDK v4.1.0 &rarr; `npm install flex-sdk@~4.1.0`
 - Adobe Flex SDK v4.0.0 &rarr; `npm install flex-sdk@~4.0.0`
 - Adobe Flex SDK v3.6.0 &rarr; `npm install flex-sdk@~3.6.0`
 - Adobe Flex SDK v3.5.0 &rarr; `npm install flex-sdk@~3.5.0`
 - Adobe Flex SDK v3.4.1 &rarr; `npm install flex-sdk@~3.4.1`
 - Adobe Flex SDK v3.4.0 &rarr; `npm install flex-sdk@~3.4.0`
 - Adobe Flex SDK v3.3.0 &rarr; `npm install flex-sdk@~3.3.0`
 - Adobe Flex SDK v3.2.0 &rarr; `npm install flex-sdk@~3.2.0`
 - Adobe Flex SDK v3.1.0 &rarr; `npm install flex-sdk@~3.1.0`
 - Adobe Flex SDK v3.0.1 &rarr; `npm install flex-sdk@~3.0.1`
 - Adobe Flex SDK v3.0.0 &rarr; `npm install flex-sdk@~3.0.0`


## License
Copyright (c) 2014 James M. Greene  
Licensed under the MIT license.



[flex/apache/site]: http://flex.apache.org/index.html "Apache Flex"
[flex/adobe/site]: http://www.adobe.com/devnet/flex.html "Adobe Flex"
[flex/adobe/compiler-options]: http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_14.html "mxmlc command line options"
[flex/sdk-versions]: https://github.com/JamesMGreene/node-flex-sdk/blob/master/FlexSDKs.md "Flex SDK version list"
[grunt/site]: (http://gruntjs.com/) "Grunt"
