import * as path from "path";
import Future = require("fibers/future");

export class ProjectSimulatorService implements IProjectSimulatorService {

	constructor(private $frameworkSimulatorServiceResolver: Project.IFrameworkSimulatorServiceResolver,
		private $project: Project.IProject) { }

	private get frameworkProjectSimulatorService(): IProjectSimulatorService {
		return this.$frameworkSimulatorServiceResolver.resolve(this.$project.projectData.Framework);
	}

	public getSimulatorParams(simulatorPackageName: string): IFuture<string[]> {
		return this.frameworkProjectSimulatorService.getSimulatorParams(simulatorPackageName);
	}
}
$injector.register("projectSimulatorService", ProjectSimulatorService);

export class CordovaSimulatorService implements IProjectSimulatorService {
	private static PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";

	constructor(private $config: IConfiguration,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $server: Server.IServer,
		private $serverExtensionsService: IServerExtensionsService) { }

	public async getSimulatorParams(simulatorPackageName: string): Promise<string[]> {
			let pluginsPath = await  this.prepareCordovaPlugins(simulatorPackageName);
			let projectData = this.$project.projectData;
			let corePlugins = this.$project.getProperty("CorePlugins", "debug");

			return [
				"--statusbarstyle", projectData.iOSStatusBarStyle,
				"--frameworkversion", projectData.FrameworkVersion,
				"--orientations", projectData.DeviceOrientations.join(";"),
				"--corepluginspath", pluginsPath,
				"--supportedplatforms", this.$project.getProjectTargets().join(";"),
				"--plugins", (corePlugins || []).join(";")
			];
	}

	private async prepareCordovaPlugins(simulatorPackageName: string): Promise<string> {
			let packageVersion = this.$serverExtensionsService.getExtensionVersion(simulatorPackageName);
			let pluginsPath = path.join(this.$serverExtensionsService.cacheDir, this.getPluginsDirName(packageVersion));

			if (!this.$fs.exists(pluginsPath)) {
				let zipFile: any;
				try {
					this.$logger.info("Downloading core Cordova plugins...");

					this.$fs.createDirectory(pluginsPath);
					let zipPath = path.join(pluginsPath, "plugins.zip");

					this.$logger.debug("Downloading Cordova plugins package into '%s'", zipPath);
					zipFile = this.$fs.createWriteStream(zipPath);
					await this.$server.cordova.getPluginsPackage(zipFile);

					this.$logger.debug("Unpacking Cordova plugins from %s", zipPath);
					await this.$fs.unzip(zipPath, pluginsPath);

					this.$logger.info("Finished downloading plugins.");
				} catch(err) {
					await this.closeStream(zipFile);
					this.$fs.deleteDirectory(pluginsPath);
					throw err;
				}
			}

			return pluginsPath;
	}

	public closeStream(stream: any): IFuture<void> {
		let future = new Future<void>();
		stream.close((err: Error, data: any) => {
			if (err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	private getPluginsDirName(serverVersion: string) {
		let result: string;
		if (this.$config.DEBUG) {
			result = CordovaSimulatorService.PLUGINS_PACKAGE_IDENTIFIER;
		} else {
			result = CordovaSimulatorService.PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
		}
		this.$logger.debug("PLUGINS dir is: " + result);
		return result;
	}
}
$injector.register("cordovaSimulatorService", CordovaSimulatorService);

export class NativeScriptSimulatorService implements IProjectSimulatorService {
	public getSimulatorParams(simulatorPackageName: string): IFuture<string[]> {
		return (() => <string[]>[]).future<string[]>()();
	}
}
$injector.register("nativeScriptSimulatorService", NativeScriptSimulatorService);
