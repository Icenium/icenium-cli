///<reference path="../.d.ts"/>
"use strict";

import * as dependencyExtensionsServiceLib from "./dependency-extensions-service-base";
import * as path from "path";
import Future = require("fibers/future");

export class AppScaffoldingExtensionsService extends dependencyExtensionsServiceLib.DependencyExtensionsServiceBase implements IAppScaffoldingExtensionsService {
	private static APP_SCAFFOLDING_NAME = "app-scaffolding";

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$progressIndicator: IProgressIndicator,
		$config: IConfiguration,
		protected $childProcess: IChildProcess,
		protected $dependencyConfigService: IDependencyConfigService,
		$options: IOptions) {
		super($options.screenBuilderCacheDir, $fs, $httpClient, $logger, $options, $progressIndicator, $config); // We should pass here the correct profileDir
	}

	public get appScaffoldingPath(): string {
		return this.getExtensionPath(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME);
	}

	public prepareAppScaffolding(): IFuture<void> {
		return (() => {
			let appScaffoldingConfig = this.$dependencyConfigService.getAppScaffoldingConfig().wait();
			appScaffoldingConfig.pathToSave = this.$options.screenBuilderCacheDir;
			let afterPrepareAction = () => {
				return (() => {
					this.npmInstall("glob-watcher@0.0.8").wait(); // HACK: With this we are able to make paths shorter with 20 symbols.

					let generatorBaseDependencies = require(path.join(this.appScaffoldingPath, "node_modules", "screen-builder-base-generator", "package.json")).dependencies;
					Future.wait(_.map(generatorBaseDependencies, (value, key) => this.npmInstall(`${key}@${value}`)));
					this.npmInstall().wait();
					this.npmDedupe().wait();
				}).future<void>()();
			};
			this.prepareDependencyExtension(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME, appScaffoldingConfig, afterPrepareAction).wait();
		}).future<void>()();
	}

	protected npmInstall(packageToInstall?: string): IFuture<void> {
		packageToInstall = packageToInstall || "";
		let command = `npm install ${packageToInstall} --production`;
		return this.$childProcess.exec(command, {cwd: this.appScaffoldingPath });
	}

	protected npmDedupe(): IFuture<void> {
		return this.$childProcess.exec("npm dedupe", {cwd: this.appScaffoldingPath});
	}
}
$injector.register("appScaffoldingExtensionsService", AppScaffoldingExtensionsService);
