///<reference path="../.d.ts"/>

"use strict";

import express = require("express");
import http = require('http');
import path = require("path");
import os = require("os");
import minimatch = require("minimatch");

export class RemoteCommand implements ICommand {
    private appBuilderDir: string;
    private packageLocation: string;

    constructor (private $logger:ILogger,
                 private $fs:IFileSystem,
                 private $express: IExpress,
                 private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices) {
        this.appBuilderDir = path.join(os.tmpDir(), 'AppBuilder');
        this.packageLocation = path.join(this.appBuilderDir, 'package.zip');

        this.$fs.ensureDirectoryExists(this.appBuilderDir).wait();
    }

    public execute(args:string[]): IFuture<void> {
        return (() => {
            this.$express.post("/launch", (req: express.Request, res: express.Response) => this.onLaunchRequest(req, res));

            this.$express.listen(parseInt(args[0]), () => this.$logger.info('Listening on port ' + args[0]));
            this.$express.run();
        }).future<void>()();
    }

    private onLaunchRequest(req: express.Request, res: express.Response) : IFuture<void> {
        return (() => {
            this.$logger.info("launch simulator request received ... ");

            var deviceFamily = req.query.deviceFamily.toLowerCase();
            var archive = this.$fs.createWriteStream(this.packageLocation);
            archive.on('error', (err: Error) => {
                this.$logger.error('Could not save the uploaded file. ' + err);
            });

            req.pipe(archive);
            this.$fs.futureFromEvent(archive, 'finish').wait();

            this.$fs.unzip(this.packageLocation, this.appBuilderDir).wait();

            var appLocation = path.join(this.appBuilderDir, this.$fs.readDirectory(this.appBuilderDir).wait().filter(minimatch.filter("*.app"))[0]);

            this.$iOSEmulatorServices.checkAvailability(false).wait();
            this.$iOSEmulatorServices.startEmulator(appLocation, <Mobile.IEmulatorOptions>{ deviceFamily: deviceFamily }).wait();

            res.status(200).end();
        }).future<void>()();
    }
}

$injector.registerCommand("remote", RemoteCommand);