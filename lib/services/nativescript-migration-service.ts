///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import * as path from "path";

export class NativeScriptMigrationService implements IFrameworkMigrationService {
	private static TYPESCRIPT_ABBREVIATION = "TS";
	private static JAVASCRIPT_ABBREVIATION = "JS";
	private static SUPPORTED_LANGUAGES = [NativeScriptMigrationService.JAVASCRIPT_ABBREVIATION, NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION];
	private static REMOTE_NATIVESCRIPT_MIGRATION_DATA_FILENAME = "NativeScript.json";

	private tnsModulesDirectoryPath: string;
	private remoteNativeScriptResourcesPath: string;
	private _nativeScriptMigrationData: INativeScriptMigrationData;
	private get nativeScriptMigrationData(): IFuture<INativeScriptMigrationData> {
		return ((): INativeScriptMigrationData => {
			this._nativeScriptMigrationData = this._nativeScriptMigrationData || this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).wait();
			return this._nativeScriptMigrationData;
		}).future<INativeScriptMigrationData>()();
	}

	constructor(private $config: IConfiguration,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $nativeScriptResources: INativeScriptResources,
		private $project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $resourceDownloader: IResourceDownloader,
		private $server: Server.IServer,
		private $staticConfig: Config.IStaticConfig){
			this.tnsModulesDirectoryPath = path.join(this.$nativeScriptResources.nativeScriptResourcesDir, "tns_modules");
			this.remoteNativeScriptResourcesPath = `http://${this.$config.AB_SERVER}/appbuilder/Resources/NativeScript`;
		}

	public downloadMigrationData(): IFuture<void> {
		return (() => {
			this.$fs.deleteDirectory(this.$nativeScriptResources.nativeScriptResourcesDir).wait();
			this.$fs.createDirectory(this.$nativeScriptResources.nativeScriptResourcesDir).wait();

			// Make sure to download this file first, as data from it is used for fileDownloadFutures
			this.downloadNativeScriptMigrationFile().wait();

			let fileDownloadFutures = _(this.nativeScriptMigrationData.wait().supportedVersions)
									.map(supportedVersion => _.map(NativeScriptMigrationService.SUPPORTED_LANGUAGES, language => this.downloadTnsModules(language, supportedVersion.version)))
									.flatten<IFuture<void>>()
									.value();
			fileDownloadFutures.push(this.downloadPackageJsonResourceFile());
			Future.wait(fileDownloadFutures);
		}).future<void>()();
	}

	public getSupportedVersions(): IFuture<string[]> {
		return ((): string[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return _.map(migrationData.supportedVersions, supportedVersion => supportedVersion.version);
		}).future<string[]>()();
	}

	public getSupportedFrameworks(): IFuture<IFrameworkVersion[]> {
		return ((): IFrameworkVersion[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return migrationData.supportedVersions;
		}).future<IFrameworkVersion[]>()();
	}

	public getDisplayNameForVersion(version: string): IFuture<string>{
		return ((): string => {
			let framework = _.find(this.getSupportedFrameworks().wait(), (fw: IFrameworkVersion) => fw.version === version);
			if(framework) {
				return framework.displayName;
			}

			this.checkIsVersionObsolete(version).wait();
			this.$errors.failWithoutHelp("Cannot find version %s in the supported versions.", version);
		}).future<string>()();
	}

	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return (() => {
			let currentFrameworkVersion = this.$project.projectData.FrameworkVersion;
			this.$logger.trace(`Migrating from version ${currentFrameworkVersion} to ${newVersion}.`);
			if(currentFrameworkVersion === newVersion) {
				return;
			}

			let projectDir = this.$project.getProjectDir().wait();
			let tnsModulesProjectPath = path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME, "tns_modules");
			let appResourcesRequiredPath = path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME, this.$staticConfig.APP_RESOURCES_DIR_NAME);
			let appResourcesObsoletePath = path.join(projectDir, this.$staticConfig.APP_RESOURCES_DIR_NAME);
			let backupName = `${tnsModulesProjectPath}.backup`;
			let shouldRollBackAppResources = false;

			// Check if current version is supported one. We cannot migrate ObsoleteVersions
			if(!_.contains(this.getSupportedVersions().wait(), currentFrameworkVersion)) {
				this.checkIsVersionObsolete(currentFrameworkVersion).wait();
				this.$errors.failWithoutHelp(`You cannot migrate from version ${currentFrameworkVersion}.`);
			}

			this.ensurePackageJsonExists(projectDir, newVersion).wait();

			try {
				// Always update tns-modules during migration
				this.$fs.rename(tnsModulesProjectPath, backupName).wait();
				this.$fs.createDirectory(tnsModulesProjectPath).wait();
				let projectType = this.$project.isTypeScriptProject().wait() ? NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION : NativeScriptMigrationService.JAVASCRIPT_ABBREVIATION;
				let pathToNewTnsModules = path.join(this.tnsModulesDirectoryPath, projectType, this.getFileNameByVersion(newVersion));
				this.$fs.unzip(pathToNewTnsModules, tnsModulesProjectPath).wait();
				if(!this.$fs.exists(appResourcesRequiredPath).wait() && this.$fs.exists(appResourcesObsoletePath).wait()) {
					this.$logger.info(`Moving ${appResourcesObsoletePath} to ${appResourcesRequiredPath}`);
					shouldRollBackAppResources = true;
					this.$fs.rename(appResourcesObsoletePath, appResourcesRequiredPath).wait();
				}
				this.$fs.deleteDirectory(backupName).wait();
			} catch(err) {
				this.$logger.trace("Error during migration. Trying to restore previous state.");
				this.$logger.trace(err);
				this.$fs.deleteDirectory(tnsModulesProjectPath).wait();
				this.$fs.rename(backupName, tnsModulesProjectPath).wait();
				if(shouldRollBackAppResources && this.$fs.exists(appResourcesRequiredPath).wait() && !this.$fs.exists(appResourcesObsoletePath).wait()) {
					this.$logger.trace(`Moving ${appResourcesObsoletePath} to ${appResourcesRequiredPath}`);
					this.$fs.rename(appResourcesRequiredPath, appResourcesObsoletePath).wait();
				}
				this.$errors.failWithoutHelp("Error during migration. Restored original state of the project.");
			}
		}).future<void>()();
	}

	private downloadNativeScriptMigrationFile(): IFuture<void> {
		let remoteFilePath = `${this.remoteNativeScriptResourcesPath}/${NativeScriptMigrationService.REMOTE_NATIVESCRIPT_MIGRATION_DATA_FILENAME}`;
		return this.$resourceDownloader.downloadResourceFromServer(remoteFilePath, this.$nativeScriptResources.nativeScriptMigrationFile);
	}

	private downloadTnsModules(language: string, version: string): IFuture<void> {
		let fileName = this.getFileNameByVersion(version);
		let remotePathUrl = `${this.remoteNativeScriptResourcesPath}/tns_modules/${language}/${fileName}`;
		let filePath = path.join(this.tnsModulesDirectoryPath, language, fileName);
		return this.$resourceDownloader.downloadResourceFromServer(remotePathUrl, filePath);
	}

	private getFileNameByVersion(version: string): string {
		return `${version}.zip`;
	}

	private getObsoleteVersions(): IFuture<string[]> {
		return ((): string[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return _.map(migrationData.obsoleteVersions, obsoleteVersion => obsoleteVersion.version);
		}).future<string[]>()();
	}

	/**
	 * Checks if the provided {N} version is obsolete and fails with correct error message in such case.
	 * If the version is not marked as obsolete, do nothing.
	 * @param {string} version The version tha has to be checked.
	 * @returns {IFuture<void>}
	 */
	private checkIsVersionObsolete(version: string): IFuture<void> {
		return (() => {
			if(_.any(this.getObsoleteVersions().wait(), obsoleteVersion => obsoleteVersion === version)) {
				this.$errors.failWithoutHelp(`Your project targets NativeScript ${version}. This version is obsolete and cannot be migrated from the command line. If you want to migrate your project, create a new project and copy over your code and resources.`);
			}
		}).future<void>()();
	}

	private ensurePackageJsonExists(projectDir: string, newVersion: string): IFuture<void> {
		return (() => {
			let npmVersions: string[] = (<any[]>this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).wait().npmVersions).map(npmVersion => npmVersion.version);
			if(_.contains(npmVersions, newVersion)
				&& !this.$fs.exists(path.join(projectDir, this.$projectConstants.PACKAGE_JSON_NAME)).wait()) {
				// From version 1.1.2 we need package.json file at the root of the project.
				this.$fs.copyFile(this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile, path.join(projectDir, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
			}
		}).future<void>()();
	}

	private downloadPackageJsonResourceFile(): IFuture<void> {
		let remoteFilePath = `${this.remoteNativeScriptResourcesPath}/${this.$projectConstants.PACKAGE_JSON_NAME}`;
		return this.$resourceDownloader.downloadResourceFromServer(remoteFilePath, this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile);
	}
}
$injector.register("nativeScriptMigrationService", NativeScriptMigrationService);
