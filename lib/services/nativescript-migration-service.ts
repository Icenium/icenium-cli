import Future = require("fibers/future");
import * as path from "path";

export class NativeScriptMigrationService implements IFrameworkMigrationService {
	private static TYPESCRIPT_ABBREVIATION = "TS";
	private static JAVASCRIPT_ABBREVIATION = "JS";
	private static SUPPORTED_LANGUAGES = [NativeScriptMigrationService.JAVASCRIPT_ABBREVIATION, NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION];
	private static REMOTE_NATIVESCRIPT_MIGRATION_DATA_FILENAME = "NativeScript.json";
	private static TYPINGS = "typings";
	private static TNS_CORE_MODULES = "tns-core-modules";
	private static TNS_MODULES = "tns_modules";

	private tnsModulesDirectoryPath: string;
	private remoteNativeScriptResourcesPath: string;
	private _nativeScriptMigrationConfiguration: INativeScriptMigrationConfiguration;
	private get nativeScriptMigrationConfiguration(): INativeScriptMigrationConfiguration {
		if (!this._nativeScriptMigrationConfiguration) {
			let projectDir = this.$project.getProjectDir(),
				tnsModulesProjectPath = path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME, NativeScriptMigrationService.TNS_MODULES),
				tnsTypingsPath = path.join(projectDir, NativeScriptMigrationService.TYPINGS, NativeScriptMigrationService.TNS_CORE_MODULES);

			this._nativeScriptMigrationConfiguration = {
				tnsModulesProjectPath: tnsModulesProjectPath,
				tnsTypingsPath: tnsTypingsPath,
				packageJsonContents: this.getProjectPackageJsonContent().wait(),

				tnsModulesBackupName: this.getBackupName(tnsModulesProjectPath),
				typingsBackupName: this.getBackupName(tnsTypingsPath),
				oldPackageJsonContents: this.getProjectPackageJsonContent().wait(),

				pathToPackageJson: this.getPathToProjectPackageJson(),
				projectDir: projectDir,
				appResourcesRequiredPath: path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME, this.$staticConfig.APP_RESOURCES_DIR_NAME),
				shouldRollBackAppResources: false
			};
		}

		return this._nativeScriptMigrationConfiguration;
	};

	private get $project(): Project.IProject {
		return this.$injector.resolve("project");
	}

	private _nativeScriptMigrationData: INativeScriptMigrationData;
	private get nativeScriptMigrationData(): INativeScriptMigrationData {
		this._nativeScriptMigrationData = this._nativeScriptMigrationData || this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile);
		return this._nativeScriptMigrationData;
	}

	constructor(private $config: IConfiguration,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectConstants: Project.IConstants,
		private $prompter: IPrompter,
		private $server: Server.IServer,
		private $resourceDownloader: IResourceDownloader,
		private $nativeScriptResources: INativeScriptResources,
		private $injector: IInjector,
		private $staticConfig: IStaticConfig,
		private $npmService: INpmService,
		private $projectMigrationService: Project.IProjectMigrationService) {
		this.tnsModulesDirectoryPath = path.join(this.$nativeScriptResources.nativeScriptResourcesDir, NativeScriptMigrationService.TNS_MODULES);
		this.remoteNativeScriptResourcesPath = `http://${this.$config.AB_SERVER}/appbuilder/Resources/NativeScript`;
	}

	public downloadMigrationData(): IFuture<void> {
		return (() => {
			this.$fs.deleteDirectory(this.$nativeScriptResources.nativeScriptResourcesDir);
			this.$fs.createDirectory(this.$nativeScriptResources.nativeScriptResourcesDir);

			// Make sure to download this file first, as data from it is used for fileDownloadFutures
			this.downloadMigrationConfigFile().wait();

			let fileDownloadFutures = _(this.nativeScriptMigrationData.supportedVersions)
				.map(supportedVersion => _.map(NativeScriptMigrationService.SUPPORTED_LANGUAGES, language => this.downloadTnsPackage(language, supportedVersion.version)))
				.flatten<IFuture<void>>()
				.value();
			fileDownloadFutures.push(this.downloadPackageJsonResourceFile());
			Future.wait(fileDownloadFutures);
		}).future<void>()();
	}

	public getSupportedVersions(): string[] {
		let migrationData = this.nativeScriptMigrationData;
		return _.map(migrationData.supportedVersions, supportedVersion => supportedVersion.version);
	}

	public getSupportedFrameworks(): IFrameworkVersion[] {
		let migrationData = this.nativeScriptMigrationData;
		return migrationData.supportedVersions;
	}

	public getDisplayNameForVersion(version: string): string {
		let framework = _.find(this.getSupportedFrameworks(), (fw: IFrameworkVersion) => fw.version === version);
		this.warnIfVersionDeprecated(version);
		if (framework) {
			return framework.displayName;
		} else {
			return version;
		}
	}

	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return (() => {
			let currentFrameworkVersion = this.$project.projectData.FrameworkVersion;
			this.$logger.trace(`Migrating from version ${currentFrameworkVersion} to ${newVersion}.`);
			if (currentFrameworkVersion === newVersion) {
				return;
			}

			this.ensurePackageJsonExists(newVersion).wait();

			this.migrateByModifyingPackageJson(currentFrameworkVersion, newVersion).wait();
		}).future<void>()();
	}

	public downloadMigrationConfigFile(targetPath?: string): IFuture<void> {
		let remoteFilePath = `${this.remoteNativeScriptResourcesPath}/${NativeScriptMigrationService.REMOTE_NATIVESCRIPT_MIGRATION_DATA_FILENAME}`;
		return this.$resourceDownloader.downloadResourceFromServer(remoteFilePath, targetPath || this.$nativeScriptResources.nativeScriptMigrationFile);
	}

	private migrateByModifyingPackageJson(currentVersion: string, newVersion: string): IFuture<void> {
		return (() => {
			try {
				this.nativeScriptMigrationConfiguration.packageJsonContents.dependencies[NativeScriptMigrationService.TNS_CORE_MODULES] = this.getModuleVersion(newVersion);

				this.$projectMigrationService.migrateTypeScriptProject().wait();
				this.$npmService.install(this.$project.getProjectDir()).wait();

				this.$fs.writeJson(this.nativeScriptMigrationConfiguration.pathToPackageJson, this.nativeScriptMigrationConfiguration.packageJsonContents);
			} catch (err) {
				this.traceError(err);
				this.$fs.writeJson(this.nativeScriptMigrationConfiguration.pathToPackageJson, this.nativeScriptMigrationConfiguration.oldPackageJsonContents);

				let message = "Error during migration. Restored original state of the project.";
				if (err.errorCode === ErrorCodes.RESOURCE_PROBLEM) {
					message = err.message;
				}

				this.$errors.failWithoutHelp(message);
			}

			this.$logger.info(`Project migrated successfully from ${currentVersion} to ${newVersion}.`);
		}).future<void>()();
	}

	private downloadTnsPackage(language: string, version: string): IFuture<void> {
		if (language === NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION) {
			let fileName = this.getFileNameByVersion(version);
			let remotePathUrl = `${this.remoteNativeScriptResourcesPath}/${NativeScriptMigrationService.TNS_MODULES}/${language}/${fileName}`;
			let filePath = path.join(this.tnsModulesDirectoryPath, language, fileName);
			return this.$resourceDownloader.downloadResourceFromServer(remotePathUrl, filePath);
		}

		return Future.fromResult();
	}

	private getFileNameByVersion(version: string): string {
		return `${version}${NativeScriptMigrationService.TNS_CORE_MODULES}.zip`;
	}

	private getDeprecatedVersions(): string[] {
		let migrationData = this.nativeScriptMigrationData;
		return _.map(migrationData.deprecatedVersions, deprecatedVersion => deprecatedVersion.version);
	}

	private warnIfVersionDeprecated(version: string): void {
		if (_.includes(this.getDeprecatedVersions(), version)) {
			this.$logger.warn(`Your project targets NativeScript ${version}. This version is deprecated and will not be available in a future release. You can still develop and build your project but it is recommended that you commit all changes to version control and migrate to a newer version of NativeScript.`);
		}
	}

	private ensurePackageJsonExists(newVersion: string): IFuture<void> {
		return (() => {
			let versions: string[] = (<any[]>this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).supportedVersions).map(version => version.version);
			if (_.includes(versions, newVersion)
				&& !this.$fs.exists(path.join(this.nativeScriptMigrationConfiguration.projectDir, this.$projectConstants.PACKAGE_JSON_NAME))) {
				// From version 1.1.2 we need package.json file at the root of the project.
				this.$fs.copyFile(this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile, path.join(this.nativeScriptMigrationConfiguration.projectDir, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
			}
		}).future<void>()();
	}

	private downloadPackageJsonResourceFile(): IFuture<void> {
		let remoteFilePath = `${this.remoteNativeScriptResourcesPath}/${this.$projectConstants.PACKAGE_JSON_NAME}`;
		return this.$resourceDownloader.downloadResourceFromServer(remoteFilePath, this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile);
	}

	private getPathToProjectPackageJson(): string {
		return path.join(this.$project.getProjectDir(), this.$projectConstants.PACKAGE_JSON_NAME);
	}

	private getProjectPackageJsonContent(): IFuture<any> {
		return ((): any => {
			let pathToPackageJson = this.getPathToProjectPackageJson();

			if (!this.$fs.exists(pathToPackageJson)) {
				this.$fs.copyFile(this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile, pathToPackageJson).wait();
			}

			return this.$fs.readJson(pathToPackageJson);
		}).future<any>()();
	}

	private getBackupName(str: string): string {
		return `${str}.backup`;
	}

	private traceError(err: Error): void {
		this.$logger.trace("Error during migration. Trying to restore previous state.");
		this.$logger.trace(err);
	}

	private getModuleVersion(version: string): string {
		let versionObject = _.find(this.nativeScriptMigrationData.supportedVersions, sv => sv.version === version);
		if (!versionObject || !versionObject.modulesVersion) {
			this.$errors.fail({
				formatStr: `There seems to be a problem with ${this.$staticConfig.CLIENT_NAME}. Try reinstalling to fix the issue.`,
				suppressCommandHelp: true,
				errorCode: ErrorCodes.RESOURCE_PROBLEM
			});
		}

		return versionObject.modulesVersion;
	}
}

$injector.register("nativeScriptMigrationService", NativeScriptMigrationService);
