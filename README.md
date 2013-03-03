# mxmlc-install

An NPM wrapper for the [Adobe Flex SDK Compiler, `mxmlc`][flex/devcenter].


## Building and Installing

```shell
npm install mxmlc-install
```

Or grab the source and

```shell
node ./install.js
```

What this is really doing is just grabbing a particular "blessed" (by
this module) version of `mxmlc`.  As new versions of the Adobe Flex SDK are released
and vetted, this module will be updated accordingly.

The package has been set up to fetch and run `mxmlc` for MacOS (darwin),
Linux based platforms (as identified by Node.js), and Windows.  If you
spot any platform weirdnesses, let me know or send a patch.


## Running

```shell
bin/mxmlc [mxmlc arguments]
```

Check out the [full list of `mxmlc` command line options][flex/compiler-options]
for more information.

And npm will install a link to the binary in `node_modules/.bin` as
it is wont to do.


## Running via node

The package exports a `path` string that contains the path to the
`mxmlc` binary/executable.

Below is an example of using this package via node.

```js
var childProcess = require('child_process');
var flexCompiler = require('mxmlc');
var binPath = flexCompiler.path;

var childArgs = [
  'arguments to pass to mxmlc',
  path.join(__dirname, 'fileToCompile.as')
];

childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
  // handle results
})
```


# Versioning

The NPM package version tracks the version of `mxmlc` that will be installed,
with an additional build number that is used for revisions to the installer
when necessary.

As such, `3.6.0`, `3.6.0+1`, and `3.6.0+2` will all install `mxmlc` v3.6.0 but each
has newer changes to the installer than the previous.

## A Note on `mxmlc`

`mxmlc` is not a library for Node.js. It is an executable of its own.

This is an _NPM wrapper_ and can be used to conveniently make `mxmlc` available.
It is not a Node.js wrapper.

Read more about Adobe Flex at the [Adobe Flex Developer Center][flex/devcenter].


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code
using [Grunt][grunt/site].


## Release History
 - 4.0.0: Published to NPM on 2013-03-03.
    - Release targeting Adobe Flex SDK v4.0.0.
 - 3.6.0: Published to NPM on 2013-03-03.
    - Release targeting Adobe Flex SDK v3.6.0.


## License
Copyright (c) 2013 James M. Greene  
Licensed under the MIT license.


[flex/devcenter]: http://www.adobe.com/devnet/flex.html "Adobe Flex Developer Center"
[flex/compiler-options]: http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_14.html "mxmlc command line options"
[grunt/site]: (http://gruntjs.com/) "Grunt"