icenium-cli
===========

Cross-Platform Command Line Interface for Icenium.

First steps
===
You must have Python 2.7.x installed. Don't install 3.x as it won't work!

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

Correct any warnings from the linter before committing.

Deploying to iOS
===
To deploy an application on iOS device, do the following:

* Install iTunes - it should be the same bitness as Node

Enabling command auto-completion in Bash
===
You can enable command auto-completion for the Bash and zsh shells. Auto-completion for
commands as well as options is supported.

If you have `icenium-cli` installed with the `-g` option, you can install auto-completion support
by executing the following command **in Bash**:

```
	$ ice completion >> ~/.bashrc
```

If you don't have `icenium-cli` installed with the `-g` option, the above command becomes:

```
	$ node bin/ice completion >> ~/.bashrc
```

and you must also manually add it to the `PATH` environment variable. Open the `.bashrc`
file in a text editor (in Windows: `$ start ~/.bashrc`) and add the following line anywhere:

```
	export PATH=$PATH:/c/work/icenium-cli/bin
```

Change the path to the `icenium-cli` working copy above to match your own. Restart Bash and you're ready to go!

Continuous integration
===
The CI task is located on the [Icenium Jenkins server](http://bpc15:8080/job/icenium-cli%20CI%20Build/).
There you can see the status of the project, the linter statistics and the test run results.

After building the packaged module, it is copied to \\telerik.com\Resources\BlackDragon\Builds\icenium-cli

[1]: http://visionmedia.github.io/mocha/#interfaces
[2]: http://chaijs.com/api/assert/
[3]: http://chaijs.com/guide/styles/#assert
