icenium-cli
===========

Cross-Platform Command Line Interface for Telerik AppBuilder.

First steps
===
You must have Python 2.7.x installed. Don't install 3.x as it won't work!

After cloning the repository, run:

```
   $ npm install
```

This will install all project dependencies.

It is a good idea to add the `bin\` folder to you path environment variable.
If you do that, you'll get the `appbuilder` command (and `ice` alias) in your path,
and you won't have to type e.g. `node ..\..\bin\appbuilder.js` before every command.

Life with TypeScript
===
Before everything else: run `$ npm install -g typescript` to install the compiler.

Manual compiling: run `$ grunt` in the project root.

Committing: you can commit only .ts files; .js files are git-ignore'd with a few special exceptions.

WebStorm integration: enable the TypeScript File Watcher. Uncheck "Immediate file synchronization",
check "Track root files only". The file watcher will continuously compile your .ts files and report
any errors as they arise. If often hangs - simply restart WebStorm to fix it. If it "forgets" to recompile
some change to a file and you need to e.g. debug your code, either make a dummy change to trigger a recompile
or run `grunt`.

You can run `grunt watch` in a separate console to have your .ts file continously recompiled.
This approach can be better than using WebStorm, because it won't lag the IDE.

Debugging
===
For the best experience, use WebStorm to debug TypeScript code. If you don't have WebStorm, read on.

For debugging try using `node-inspector`. To install it run:

```
	$ npm install -g node-inspector
```

Open a new node.js console, run `node-inspector` and leave it running. You don't need to ever restart it or anything.

Start `node` with the `--debug-brk` parameter, e.g.:

```
	$ node --debug-brk bin\appbuilder.js build Android
```

Open Chrome, open `127.0.0.1:8080/debug?port=5858` and start debugging.

* Place breakpoints by clicking on the line number
* Use F10 and F11 to step over and step into
* Use F8 to continue (like F5 in VS)
* If you need to place a breakpoint in a file that is not open, then use the navigator in the top-left corner to see all files in the project.

Fiddler
===
To see your HTTP requests in Fiddler, open `config\config.json` and set the `PROXY_TO_FIDDLER` property to `true`. Don't commit it, though! You may commit Fiddler auto-detection, though :)

Writing unit tests
===
To add a test for a new module, do the following:

* add a test file to `test/`, e.g. `test/my-component.ts`
* write the test using [mocha][1]'s BDD interface and [chai][3]'s [assertions][2] (preferably)

To compile and run all unit tests, run the following in the console:

```
   $ grunt test
```

Just running the tests is done using `$ npm test`. Just compiling the tests is done using `$ grunt ts:devall`.

Deploying to iOS
===
To deploy an application on iOS device, install iTunes.

Enabling command auto-completion in Bash
===
You can enable command auto-completion for the Bash and zsh shells. Auto-completion for
commands as well as options is supported.

If you don't have `icenium-cli` installed with the `-g` option, you can install auto-completion using:

```
	$ node bin/appbuilder completion >> ~/.bashrc
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
There you can see the status of the project and the test run results.

After building the packaged module, it is copied to \\telerik.com\Resources\BlackDragon\Builds\appbuilder-cli

Clean install for testing
===
Install prerequisites:
* Node.js 32-bit - http://nodejs.org/dist/v0.10.25/node-v0.10.25-x86.msi
* Android ADB USB Driver (skip this step if you have installed the Android SDK) - "R:\BlackDragon\Android\Universal ADB driver\UniversalAdbDriverSetup6.msi"

Copy the .tgz file locally, as npm doesn't work with mapped drives. In any terminal:

```
	$ npm i -g path/to/icenium-cli-0.1.0.tgz
```

Restart Git Bash and you're ready to roll.

Developing the CLI on a Mac
===
The Ice server can run only on Windows. The steps below will enable you to connect
a CLI running on your Mac to the Ice server running on the Windows VM.

* Windows: run cmd, execute `ipconfig` and write down the IPv4 address
* Mac: open terminal and execute `sudo pico /etc/hosts`
* Mac: add the following line to the end of the file: `icetest.icenium.com 192.168.x.x` where the address is the Windows' IP
* Mac: Ctrl+O, Enter, Ctrl-X
* Windows: change the TFIS endpoint in your Ice Web.config to point to localtfis.telerik.com
* Mac: change the AB_SERVER in config.json to point to icetest.icenium.com
* Mac: login using your localtfis credentials (can be edited on integrationadmin.telerik.com)

That's it. Don't forget that icetest.icenium.com will henceforth be clobbered on your Mac.

[1]: http://visionmedia.github.io/mocha/#interfaces
[2]: http://chaijs.com/api/assert/
[3]: http://chaijs.com/guide/styles/#assert
