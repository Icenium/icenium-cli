///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import ProjectCommandBaseLib = require("./project-command-base");
import path = require("path");
import options = require("./../../options");

export class CreateCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	private static GENERATOR_NAME = "generator-kendo-ui-mobile";

	constructor(public $project: Project.IProject,
				public $errors: IErrors,
				public $logger: ILogger,
		private $childProcess: IChildProcess,
		private $projectConstants: Project.IProjectConstants,
		private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
		private $screenBuilderService: IScreenBuilderService) {
		super($project, $errors, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			try {
				this.$screenBuilderService.prepareScreenBuilder(CreateCommand.GENERATOR_NAME).wait();
				var appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;
				var projectDirPath = path.resolve(options.path || ".");

				var cliServicePath = path.join(appScaffoldingPath, "lib/cliService");
				var Scaffolder = require(cliServicePath);
				var connector = {
					generatorsCache: path.join(appScaffoldingPath, "cache"),
					path: projectDirPath,
					dependencies: ['generator-kendo-ui-mobile@latest'],
					connect: function _cnnct(done: any) {
						done();
					},
					logger: this.$logger.trace.bind(this.$logger)
				};
				var s = new Scaffolder(connector);

				try {
					var future = new Future<void>();

					s.promptGenerate("app", (err:any) => {
						if (err) {
							this.$logger.trace(err);
							future.throw(err);
						} else {
							future.return();
						}
					});

					future.wait();
				} catch(e) {
					this.$errors.fail("Error while creating kendo project: " + e);
				}

				this.$logger.trace("Installing project dependencies using bower");
				this.$childProcess.exec("bower install", { cwd: projectDirPath }).wait();

				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
			} catch(err) {
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("create|*default", CreateCommand);