icenium-cli
===========

Cross Platform Command Line Interface for Icenium.

First steps
===
After cloning the repository, run:

```
   $ npm install
```

This will install all project dependencies.


Debugging
===
For debugging try using `node-inspector`. To install it run:

```
	$ npm install -g node-inspector
```

Open a new node.js console, run `node-inspector` and leave it running. You don't need to ever restart it or anything.

Start `node` with the `--debug-brk` parameter, e.g.:

```
	$ node --debug-brk bin\ice build Android
```

Open Chrome, open `127.0.0.1:8080/debug?port=5858` and start debugging.

* Place breakpoints by clicking on the line number
* Use F10 and F11 to step over and step into
* Use F8 to continue (like F5 in VS)
* If you need to place a breakpoint in a file that is not open, then use the navigator in the top-left corner to see all files in the project.

Fiddler
===
To see your HTTP requests in Fiddler, open `config.js` and set the `PROXY_TO_FIDDLER` property to `true`. Don't commit it, though! You may commit Fiddler auto-detection, though :)

Writing unit tests
===
To add a test for a new module, do the following:

* add a test file to `test/`, e.g. `test/my-component.js`
* write the test using [mocha][1]'s BDD interface and [chai][3]'s [assertions][2] (preferably)

To run all unit tests, run the following in the console:

```
   $ npm test
```

Before commiting
===
Run the linter:

```
   $ lint
```

Deploying iOS application
==
To deploy an application on iOS device, do the following:

* install iTunes
* install python
* run the followings in the console:

```
	$ npm install node-gyp --save
	$ npm install ref --save
	$ npm install ffi --save
```	
Correct any warnings from the linter before commiting.

[1]: http://visionmedia.github.io/mocha/#interfaces
[2]: http://chaijs.com/api/assert/
[3]: http://chaijs.com/guide/styles/#assert

