///<reference path="../.d.ts"/>
"use strict";

import dependencyExtensionsServiceLib = require("./dependency-extensions-service-base");
import options = require("../common/options");
import path = require("path");
import util = require("util");

export class AppScaffoldingExtensionsService extends dependencyExtensionsServiceLib.DependencyExtensionsServiceBase implements IAppScaffoldingExtensionsService {
	private static APP_SCAFFOLDING_NAME = "app-scaffolding";

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$progressIndicator: IProgressIndicator,
		protected $childProcess: IChildProcess,
		protected $dependencyConfigService: IDependencyConfigService) {
		super(options.defaultProfileDir === options.profileDir ? path.join(process.env.LocalAppData, "Telerik", "sb") : options.profileDir, $fs, $httpClient, $logger, $progressIndicator); // We should pass here the correct profileDir
	}

	public get appScaffoldingPath(): string {
		return this.getExtensionPath(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME);
	}

	public prepareAppScaffolding(): IFuture<void> {
		return (() => {
			var appScaffoldingConfig = this.$dependencyConfigService.getAppScaffoldingConfig().wait();
			appScaffoldingConfig.pathToSave = options.defaultProfileDir === options.profileDir ? path.join(process.env.LocalAppData, "Telerik", "sb") : options.profileDir;
			var afterPrepareAction = () => {
				return (() => {
					this.npmInstall("glob-watcher@0.0.8").wait(); // HACK: With this we are able to make paths shorter with 20 symbols.
					this.npmInstall().wait();
					this.npmDedupe().wait();
				}).future<void>()();
			};
			this.prepareDependencyExtension(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME, appScaffoldingConfig, afterPrepareAction).wait();
		}).future<void>()();
	}

	protected npmInstall(packageToInstall?: string): IFuture<void> {
		packageToInstall = packageToInstall || "";
		var command = util.format("npm install %s --production", packageToInstall);
		return this.$childProcess.exec(command, {cwd: this.appScaffoldingPath });
	}

	protected npmDedupe(): IFuture<void> {
		return this.$childProcess.exec("npm dedupe", {cwd: this.appScaffoldingPath});
	}
}
$injector.register("appScaffoldingExtensionsService", AppScaffoldingExtensionsService);