///<reference path="../.d.ts"/>
"use strict";

import dependencyExtensionsServiceLib = require("./dependency-extensions-service-base");

export class AppScaffoldingExtensionsService extends dependencyExtensionsServiceLib.DependencyExtensionsServiceBase implements IAppScaffoldingExtensionsService {
	private static APP_SCAFFOLDING_NAME = "app-scaffolding";

	constructor($fs: IFileSystem,
				$httpClient: Server.IHttpClient,
				$logger: ILogger,
				$progressIndicator: IProgressIndicator,
				private $childProcess: IChildProcess,
		private $dependencyConfigService: IDependencyConfigService) {
		super($fs, $httpClient, $logger, $progressIndicator);
	}

	public get appScaffoldingPath(): string {
		return this.getExtensionPath(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME);
	}

	public prepareAppScaffolding(): IFuture<void> {
		return (() => {
			var appScaffoldingConfig = this.$dependencyConfigService.getAppScaffoldingConfig().wait();
			var afterPrepareAction = () => this.$childProcess.exec("npm install", {cwd: this.appScaffoldingPath });
			this.prepareDependencyExtension(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME, appScaffoldingConfig, afterPrepareAction).wait();
		}).future<void>()();
	}
}
$injector.register("appScaffoldingExtensionsService", AppScaffoldingExtensionsService);