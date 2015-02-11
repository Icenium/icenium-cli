///<reference path="../.d.ts"/>
"use strict";

import express = require("express");
import http = require('http');
import path = require("path");
import os = require("os");
import minimatch = require("minimatch");
import ip = require("ip");
import hostInfo = require("../common/host-info");
import options = require("./../options");

export class PortCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(!validationValue) {
				this.$errors.fail("You must specify a port number.");
			}

			var parsedPortNumber = parseInt(validationValue);
			if(parsedPortNumber === NaN || parsedPortNumber < 0 || parsedPortNumber > 65536) {
				this.$errors.fail("You must specify a port number between 0 and 65536.");
			}
			return true;
		}).future<boolean>()();
	}
}

export class RemoteCommand implements ICommand {
	private appBuilderDir: string;
	private packageLocation: string;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $express: IExpress,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $domainNameSystem: IDomainNameSystem) {
		this.appBuilderDir = path.join(os.tmpDir(), 'AppBuilder');
		this.packageLocation = path.join(this.appBuilderDir, 'package.zip');
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(args.length === 0) {
				this.$errors.fail("You must specify a valid port number. Valid values are between 1 and 65535.");
			}

			var parsedPortNumber = parseInt(args[0]);
			if( isNaN(parsedPortNumber) || parsedPortNumber <= 0 || parsedPortNumber >= 65536) {
				this.$errors.fail("You must specify a valid port number. Valid values are between 1 and 65535.");
			}

			if (!hostInfo.isWindows() && (parsedPortNumber < 1024) && process.getuid() !== 0) {
				this.$errors.fail("Port %s is a system port and cannot be used." + os.EOL +
				"To use a non-system port, re-run the command with a port number greater than 1023.", parsedPortNumber.toString());
			}

			this.$fs.ensureDirectoryExists(this.appBuilderDir).wait();

			this.$express.post("/launch", (req: express.Request, res: express.Response) => this.onLaunchRequest(req, res));
			var domain = this.$domainNameSystem.getDomains().wait()[0];

			this.$express.listen(parsedPortNumber, () => {
				var ipAddress = ip.address();
				this.$logger.info("Listening on port " + parsedPortNumber);
				if(domain) {
					this.$logger.info("In the AppBuilder Windows client or the extension for Visual Studio, provide the connection information for this server in one of the following formats:\n" +
						" - Address: http://" + ipAddress + " Port: " + parsedPortNumber + "\n" +
						" - Address: http://" + domain + " Port: " + parsedPortNumber);
				} else {
					this.$logger.info("In the AppBuilder Windows client or the extension for Visual Studio, provide the connection information for this server in the following format:\n" +
						" - Address: http://" + ipAddress + " Port: " + parsedPortNumber);
				}
			});
			this.$express.run();
		}).future<void>()();
	}

	allowedParameters = [new PortCommandParameter(this.$errors)];

	private onLaunchRequest(req: express.Request, res: express.Response): IFuture<void> {
		return (() => {
			this.$logger.info("launch simulator request received ... ");
			// Clean the tempdir before new launch
			this.$fs.deleteDirectory(this.appBuilderDir).wait();
			this.$fs.createDirectory(this.appBuilderDir).wait();

			var deviceFamily = req.query.deviceFamily.toLowerCase();
			var archive = this.$fs.createWriteStream(this.packageLocation);
			archive.on('error', (err: Error) => {
				this.$logger.error('Could not save the uploaded file. ' + err);
				res.status(500).send('Could not save the uploaded file. ' + err).end();
			});

			req.pipe(archive);
			this.$fs.futureFromEvent(archive, 'finish').wait();

			this.$fs.unzip(this.packageLocation, this.appBuilderDir).wait();

			var appLocation = path.join(this.appBuilderDir, this.$fs.readDirectory(this.appBuilderDir).wait().filter(minimatch.filter("*.app"))[0]);

			options.deviceType = deviceFamily;
			this.$iOSEmulatorServices.checkAvailability(false).wait();
			this.$iOSEmulatorServices.startEmulator(appLocation).wait();

			res.status(200).end();
		}).future<void>()();
	}
}

$injector.registerCommand("remote", RemoteCommand);