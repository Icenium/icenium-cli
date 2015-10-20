///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import * as path from "path";
import * as semver from "semver";

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
			let projectDir = this.$project.getProjectDir().wait(),
				tnsModulesProjectPath = path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME, NativeScriptMigrationService.TNS_MODULES),
				tnsTypingsPath = path.join(projectDir, NativeScriptMigrationService.TYPINGS, NativeScriptMigrationService.TNS_CORE_MODULES);

			this._nativeScriptMigrationConfiguration = {
				tnsModulesProjectPath: tnsModulesProjectPath,
				tnsTypingsPath: tnsTypingsPath,
				packageJsonContents: this.getProjectPackageJsonContent().wait(),

				tnsModulesBackupName: this.getBackupName(tnsModulesProjectPath),
				typingsBackupName: this.getBackupName(tnsTypingsPath),
				oldPackageJsonContents: this.getProjectPackageJsonContent().wait(),

				pathToPackageJson: this.getPathToProjectPackageJson().wait(),
				projectDir: projectDir,
				appResourcesRequiredPath: path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME, this.$staticConfig.APP_RESOURCES_DIR_NAME),
				appResourcesObsoletePath: path.join(projectDir, this.$staticConfig.APP_RESOURCES_DIR_NAME)
			};
		}

		return this._nativeScriptMigrationConfiguration;
	};

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
		private $prompter: IPrompter,
		private $resourceDownloader: IResourceDownloader,
		private $server: Server.IServer,
		private $staticConfig: Config.IStaticConfig){
			this.tnsModulesDirectoryPath = path.join(this.$nativeScriptResources.nativeScriptResourcesDir, NativeScriptMigrationService.TNS_MODULES);
			this.remoteNativeScriptResourcesPath = `http://${this.$config.AB_SERVER}/appbuilder/Resources/NativeScript`;
		}

	public downloadMigrationData(): IFuture<void> {
		return (() => {
			this.$fs.deleteDirectory(this.$nativeScriptResources.nativeScriptResourcesDir).wait();
			this.$fs.createDirectory(this.$nativeScriptResources.nativeScriptResourcesDir).wait();

			// Make sure to download this file first, as data from it is used for fileDownloadFutures
			this.downloadNativeScriptMigrationFile().wait();

			let fileDownloadFutures = _(this.nativeScriptMigrationData.wait().supportedVersions)
									.map(supportedVersion => _.map(NativeScriptMigrationService.SUPPORTED_LANGUAGES, language => this.downloadTnsPackage(language, supportedVersion.version)))
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
			this.warnIfVersionObsolete(version).wait();
			if(framework) {
				return framework.displayName;
			} else {
				this.throwIfVersionDeleted(version).wait();
				return version;
			}
		}).future<string>()();
	}

	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return (() => {
			let currentFrameworkVersion = this.$project.projectData.FrameworkVersion;
			this.$logger.trace(`Migrating from version ${currentFrameworkVersion} to ${newVersion}.`);
			if(currentFrameworkVersion === newVersion) {
				return;
			}

			this.throwIfVersionDeleted(currentFrameworkVersion).wait();

			let modulesNpmMinimumVersion = this.nativeScriptMigrationData.wait().modulesNpmMinimumVersion;

			this.ensurePackageJsonExists(newVersion).wait();

			if (semver.lt(currentFrameworkVersion, modulesNpmMinimumVersion) && semver.lt(newVersion, modulesNpmMinimumVersion)) {
				this.migrateByReplacingTnsModules(newVersion).wait();
			} else if (semver.lt(currentFrameworkVersion, modulesNpmMinimumVersion) && semver.gte(newVersion, modulesNpmMinimumVersion)) {
				this.migrateByGettingTnsModulesFromNpm(newVersion).wait();
			} else if (semver.gte(currentFrameworkVersion, modulesNpmMinimumVersion) && semver.lt(newVersion, modulesNpmMinimumVersion)) {
				this.migrateByGettingTnsModulesFromZip(newVersion).wait();
			} else {
				this.migrateByModifyingPackageJson(newVersion).wait();
			}
		}).future<void>()();
	}

	private migrateByReplacingTnsModules(newVersion: string): IFuture<void> {
		return (() => {
			try {
				// Always update tns-modules during migration
				this.$fs.rename(this.nativeScriptMigrationConfiguration.tnsModulesProjectPath, this.nativeScriptMigrationConfiguration.tnsModulesBackupName).wait();
				this.$fs.createDirectory(this.nativeScriptMigrationConfiguration.tnsModulesProjectPath).wait();
				this.extractTnsModulesPackage(newVersion, this.nativeScriptMigrationConfiguration.tnsModulesProjectPath).wait();
				this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.tnsModulesBackupName).wait();
			} catch (err) {
				this.traceError(err);
				this.restoreOriginalTnsModulesDirectory().wait();
				this.moveAppResourcesDirectory(this.nativeScriptMigrationConfiguration.appResourcesRequiredPath, this.nativeScriptMigrationConfiguration.appResourcesObsoletePath).wait();
				this.$errors.failWithoutHelp("Error during migration. Restored original state of the project.");
			}
		}).future<void>()();
	}

	private migrateByGettingTnsModulesFromNpm(newVersion: string): IFuture<void> {
		return (() => {
			this.promptForConfirmation(`Migrating from NativeScript ${this.$project.projectData.FrameworkVersion} to ${newVersion} requires removing the "${NativeScriptMigrationService.TNS_MODULES}" directory to your project and modifying your ${this.$projectConstants.PACKAGE_JSON_NAME} file to include the required dependencies. Are you sure you want to continue?`).wait();

			try {
				this.$fs.rename(this.nativeScriptMigrationConfiguration.tnsModulesProjectPath, this.nativeScriptMigrationConfiguration.tnsModulesBackupName).wait();
				this.nativeScriptMigrationConfiguration.packageJsonContents.dependencies[NativeScriptMigrationService.TNS_CORE_MODULES] = this.getModuleVersion(newVersion).wait();
				this.executeMigrationActions(this.nativeScriptMigrationConfiguration.packageJsonContents,
					this.nativeScriptMigrationConfiguration.tnsModulesProjectPath,
					this.nativeScriptMigrationConfiguration.tnsModulesBackupName,
					() => Future.fromResult(),
					() => this.$fs.unzip(this.getPathToTypingsZip(newVersion),
					this.nativeScriptMigrationConfiguration.tnsTypingsPath)).wait();

				this.moveAppResourcesDirectory(this.nativeScriptMigrationConfiguration.appResourcesObsoletePath, this.nativeScriptMigrationConfiguration.appResourcesRequiredPath).wait();
				this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.typingsBackupName).wait();
				this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.tnsModulesBackupName).wait();
			} catch (err) {
				this.traceError(err);
				this.restoreOriginalTnsModulesDirectory().wait();
				this.moveAppResourcesDirectory(this.nativeScriptMigrationConfiguration.appResourcesRequiredPath, this.nativeScriptMigrationConfiguration.appResourcesObsoletePath).wait();
				this.executeMigrationActions(this.nativeScriptMigrationConfiguration.oldPackageJsonContents,
					this.nativeScriptMigrationConfiguration.tnsModulesBackupName,
					this.nativeScriptMigrationConfiguration.tnsModulesProjectPath,
					() => this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.tnsTypingsPath),
					() => Future.fromResult()).wait();

				let message = "Error during migration. Restored original state of the project.";
				if (err.errorCode === ErrorCodes.RESOURCE_PROBLEM) {
					message = err.message;
				}

				this.$errors.failWithoutHelp(message);
			}
		}).future<void>()();
	}

	private migrateByGettingTnsModulesFromZip(newVersion: string): IFuture<void> {
		return (() => {
			this.promptForConfirmation(`Migrating from NativeScript ${this.$project.projectData.FrameworkVersion} to ${newVersion} requires adding the "${NativeScriptMigrationService.TNS_MODULES}" directory to your project and modifying your ${this.$projectConstants.PACKAGE_JSON_NAME} file to exclude the required dependencies. Are you sure you want to continue?`).wait();

			try {
				delete this.nativeScriptMigrationConfiguration.packageJsonContents.dependencies[NativeScriptMigrationService.TNS_CORE_MODULES];
				this.executeMigrationActions(this.nativeScriptMigrationConfiguration.packageJsonContents,
					this.nativeScriptMigrationConfiguration.tnsTypingsPath,
					this.nativeScriptMigrationConfiguration.typingsBackupName,
					() => Future.fromResult(),
					() => Future.fromResult()).wait();

				this.extractTnsModulesPackage(newVersion, this.nativeScriptMigrationConfiguration.tnsModulesProjectPath).wait();
				this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.typingsBackupName).wait();
			} catch (err) {
				this.traceError(err);
				this.deleteOriginalTnsModulesDirectory().wait();
				this.executeMigrationActions(this.nativeScriptMigrationConfiguration.oldPackageJsonContents,
					this.nativeScriptMigrationConfiguration.typingsBackupName,
					this.nativeScriptMigrationConfiguration.tnsTypingsPath,
					() => Future.fromResult(),
					() => Future.fromResult()).wait();

				this.$errors.failWithoutHelp("Error during migration. Restored original state of the project.");
			}
		}).future<void>()();
	}

	private migrateByModifyingPackageJson(newVersion: string): IFuture<void> {
		return (() => {
			try {
				this.nativeScriptMigrationConfiguration.packageJsonContents.dependencies[NativeScriptMigrationService.TNS_CORE_MODULES] = this.getModuleVersion(newVersion).wait();
				let afterRenameAction = () => (() => {
					this.$fs.unzip(this.getPathToTypingsZip(newVersion), this.nativeScriptMigrationConfiguration.tnsTypingsPath).wait();
					this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.typingsBackupName).wait();
				}).future<void>()();

				this.executeMigrationActions(this.nativeScriptMigrationConfiguration.packageJsonContents,
					this.nativeScriptMigrationConfiguration.tnsTypingsPath,
					this.nativeScriptMigrationConfiguration.typingsBackupName,
					() => Future.fromResult(),
					afterRenameAction).wait();
			} catch (err) {
				this.traceError(err);
				this.executeMigrationActions(this.nativeScriptMigrationConfiguration.oldPackageJsonContents,
					this.nativeScriptMigrationConfiguration.typingsBackupName,
					this.nativeScriptMigrationConfiguration.tnsTypingsPath,
					() => this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.tnsTypingsPath),
					() => Future.fromResult()).wait();

				let message = "Error during migration. Restored original state of the project.";
				if (err.errorCode === ErrorCodes.RESOURCE_PROBLEM) {
					message = err.message;
				}

				this.$errors.failWithoutHelp(message);
			}
		}).future<void>()();
}

	private downloadNativeScriptMigrationFile(): IFuture<void> {
		let remoteFilePath = `${this.remoteNativeScriptResourcesPath}/${NativeScriptMigrationService.REMOTE_NATIVESCRIPT_MIGRATION_DATA_FILENAME}`;
		return this.$resourceDownloader.downloadResourceFromServer(remoteFilePath, this.$nativeScriptResources.nativeScriptMigrationFile);
	}

	private downloadTnsPackage(language: string, version: string): IFuture<void> {
		if (language === NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION || semver.lt(version, this.nativeScriptMigrationData.wait().modulesNpmMinimumVersion)) {
			let fileName = this.getFileNameByVersion(version);
			let remotePathUrl = `${this.remoteNativeScriptResourcesPath}/${NativeScriptMigrationService.TNS_MODULES}/${language}/${fileName}`;
			let filePath = path.join(this.tnsModulesDirectoryPath, language, fileName);
			return this.$resourceDownloader.downloadResourceFromServer(remotePathUrl, filePath);
		}

		return Future.fromResult();
	}

	private getFileNameByVersion(version: string): string {
		let fileSuffix = semver.gte(version, this.nativeScriptMigrationData.wait().modulesNpmMinimumVersion) ? NativeScriptMigrationService.TNS_CORE_MODULES : "";
		return `${version}${fileSuffix}.zip`;
	}

	private getDeletedVersions(): IFuture<string[]> {
		return ((): string[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return _.map(migrationData.deletedVersions, deletedVersion => deletedVersion.version);
		}).future<string[]>()();
	}

	private warnIfVersionObsolete(version: string): IFuture<void> {
		return (() => {
			if (!_.contains(this.getSupportedVersions().wait(), version) && !this.isDeleted(version).wait()) {
				this.$logger.warn(`Your project targets NativeScript ${version}. This version is deprecated and will become obsolete in a future release. You can still develop and build your project but it is recommended that you commit all changes to version control and migrate to a newer version of NativeScript.`);
			}
		}).future<void>()();
	}

	private throwIfVersionDeleted(version: string): IFuture<void> {
		return (() => {
			if (this.isDeleted(version).wait()) {
				this.$errors.failWithoutHelp(`Your project targets NativeScript ${version}. This version is obsolete. You can no longer develop, build or migrate your project from the command line. If you want to migrate your project, create a new project and copy over your code and resources.`);
			}
		}).future<void>()();
	}

	private isDeleted(version: string): IFuture<void> {
		return (() => {
			return _.contains(this.getDeletedVersions().wait(), version);
		}).future<void>()();
	}

	private ensurePackageJsonExists(newVersion: string): IFuture<void> {
		return (() => {
			let npmVersions: string[] = (<any[]>this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).wait().npmVersions).map(npmVersion => npmVersion.version);
			if(_.contains(npmVersions, newVersion)
				&& !this.$fs.exists(path.join(this.nativeScriptMigrationConfiguration.projectDir, this.$projectConstants.PACKAGE_JSON_NAME)).wait()) {
				// From version 1.1.2 we need package.json file at the root of the project.
				this.$fs.copyFile(this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile, path.join(this.nativeScriptMigrationConfiguration.projectDir, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
			}
		}).future<void>()();
	}

	private downloadPackageJsonResourceFile(): IFuture<void> {
		let remoteFilePath = `${this.remoteNativeScriptResourcesPath}/${this.$projectConstants.PACKAGE_JSON_NAME}`;
		return this.$resourceDownloader.downloadResourceFromServer(remoteFilePath, this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile);
	}

	private getPathToProjectPackageJson(): IFuture<string> {
		return (() => {
			return path.join(this.$project.getProjectDir().wait(), this.$projectConstants.PACKAGE_JSON_NAME);
		}).future<string>()();
	}

	private getProjectPackageJsonContent(): IFuture<any> {
		return ((): any => {
			let pathToPackageJson = this.getPathToProjectPackageJson().wait();

			if(!this.$fs.exists(pathToPackageJson).wait()) {
				this.$fs.copyFile(this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile, pathToPackageJson).wait();
			}

			return this.$fs.readJson(pathToPackageJson).wait();
		}).future<any>()();
	}

	private getPathToTypingsZip(version: string): string {
		return path.join(this.tnsModulesDirectoryPath, NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION, `${version}${NativeScriptMigrationService.TNS_CORE_MODULES}.zip`);
	}

	private getBackupName(str: string): string {
		return `${str}.backup`;
	}

	private promptForConfirmation(message: string): IFuture<void> {
		return (() => {
			let shouldMigrate = this.$prompter.confirm(message, () => true).wait();
			if (!shouldMigrate) {
				this.$errors.failWithoutHelp('Operation canceled.');
			}
		}).future<void>()();
	}

	private extractTnsModulesPackage(newVersion: string, tnsModulesProjectPath: string): IFuture<void> {
		return (() => {
			let projectType = this.$project.isTypeScriptProject().wait() ? NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION : NativeScriptMigrationService.JAVASCRIPT_ABBREVIATION;
			let pathToNewTnsModules = path.join(this.tnsModulesDirectoryPath, projectType, this.getFileNameByVersion(newVersion));
			this.$fs.unzip(pathToNewTnsModules, tnsModulesProjectPath).wait();
			this.moveAppResourcesDirectory(this.nativeScriptMigrationConfiguration.appResourcesObsoletePath, this.nativeScriptMigrationConfiguration.appResourcesRequiredPath).wait();
		}).future<void>()();
	}

	private moveAppResourcesDirectory(from: string, to: string): IFuture<void> {
		return (() => {
			if (this.$fs.exists(from).wait() && !this.$fs.exists(to).wait()) {
				this.$logger.trace(`Moving ${from} to ${to}`);
				this.$fs.rename(from, to).wait();
			}
		}).future<void>()();
	}

	private traceError(err: Error): void {
		this.$logger.trace("Error during migration. Trying to restore previous state.");
		this.$logger.trace(err);
	}

	private deleteOriginalTnsModulesDirectory(): IFuture<void> {
		return this.$fs.deleteDirectory(this.nativeScriptMigrationConfiguration.tnsModulesProjectPath);
	}

	private restoreOriginalTnsModulesDirectory(): IFuture<void> {
		return (() => {
			this.deleteOriginalTnsModulesDirectory().wait();
			this.$fs.rename(this.nativeScriptMigrationConfiguration.tnsModulesBackupName, this.nativeScriptMigrationConfiguration.tnsModulesProjectPath).wait();
		}).future<void>()();
	}

	private executeMigrationActions(jsonContents:any, oldPath: string, newPath: string, beforeRenameAction: () => IFuture<void>, afterRenameAction: () => IFuture<void>): IFuture<void> {
		return (() => {
			this.$fs.writeJson(this.nativeScriptMigrationConfiguration.pathToPackageJson, jsonContents).wait();
			if (this.$project.isTypeScriptProject().wait()) {
				beforeRenameAction().wait();

				if (this.$fs.exists(oldPath).wait()) {
					this.$fs.rename(oldPath, newPath).wait();
				}

				afterRenameAction().wait();
			}
		}).future<void>()();
	}

	private getModuleVersion(version: string): IFuture<string> {
		return (() => {
			let versionObject = _.find(this.nativeScriptMigrationData.wait().supportedVersions, sv => sv.version === version);
			if (!versionObject || !versionObject.modulesVersion) {
				this.$errors.fail({
					formatStr:`There seems to be a problem with ${this.$staticConfig.CLIENT_NAME}. Try reinstalling to fix the issue.`,
					suppressCommandHelp: true,
					errorCode: ErrorCodes.RESOURCE_PROBLEM
				});
			}

			return versionObject.modulesVersion;
		}).future<string>()();
	}
}
$injector.register("nativeScriptMigrationService", NativeScriptMigrationService);
