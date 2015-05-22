///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import helpers = require("./../helpers");

export class NativeScriptMigrationService implements IFrameworkMigrationService {
	private static TYPESCRIPT_ABBREVIATION = "TS";
	private static JAVASCRIPT_ABBREVIATION = "JS";
	private static SUPPORTED_LANGUAGES = [NativeScriptMigrationService.JAVASCRIPT_ABBREVIATION, NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION];
	private nativeScriptMigrationFile: string;
	private tnsModulesDirectoryPath: string;
	private remoteTnsModulesDirectoryPath: string;

	private _nativeScriptMigrationData: Server.NativeScriptMigrationData;
	private get nativeScriptMigrationData(): IFuture<Server.NativeScriptMigrationData> {
		return ((): Server.NativeScriptMigrationData => {
			this._nativeScriptMigrationData = this._nativeScriptMigrationData || this.$fs.readJson(this.nativeScriptMigrationFile).wait();
			return this._nativeScriptMigrationData;
		}).future<Server.NativeScriptMigrationData>()();
	}

	constructor(private $fs: IFileSystem,
		private $server: Server.IServer,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $resources: IResourceLoader,
		private $config: IConfiguration,
		private $httpClient: Server.IHttpClient) {
			let nativeScriptResourcesDir = this.$resources.resolvePath("NativeScript");
			this.tnsModulesDirectoryPath = path.join(nativeScriptResourcesDir, "tns_modules");
			this.remoteTnsModulesDirectoryPath = `http://${this.$config.AB_SERVER}/appbuilder/Resources/NativeScript/tns_modules`;
			this.nativeScriptMigrationFile =  path.join(nativeScriptResourcesDir, "nativeScript-migration-data.json");
		}

	public downloadMigrationData(): IFuture<void> {
		return (() => {
			this.$fs.deleteDirectory(this.tnsModulesDirectoryPath).wait();
			this.$fs.createDirectory(this.tnsModulesDirectoryPath).wait();
	
			let json = this.$server.nativescript.getMigrationData().wait();
			let supportedVersions = _.map(json.SupportedVersions, supportedVersion => {
				supportedVersion.Version = this.parseMscorlibVersion(supportedVersion.Version);
				return supportedVersion;
			});
			_.each(json.ObsoleteVersions, obsoleteVersion => {
				obsoleteVersion.Version = this.parseMscorlibVersion(obsoleteVersion.Version); 
			});

			this.$fs.writeJson(this.nativeScriptMigrationFile, json).wait();
			let fileDownloadFutures = _(supportedVersions)
									.map(supportedVersion => _.map(NativeScriptMigrationService.SUPPORTED_LANGUAGES, language => this.downloadTnsModules(language, supportedVersion.Version)))
									.flatten<IFuture<void>>()
									.value();
			Future.wait(fileDownloadFutures);
		}).future<void>()();
	}

	public getSupportedVersions(): IFuture<string[]> {
		return ((): string[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return _.map(migrationData.SupportedVersions, supportedVersion => supportedVersion.Version);
		}).future<string[]>()();
	}

	public getSupportedFrameworks(): IFuture<Server.FrameworkVersion[]> {
		return ((): Server.FrameworkVersion[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return migrationData.SupportedVersions;
		}).future<Server.FrameworkVersion[]>()();
	}

	public getDisplayNameForVersion(version: string): IFuture<string>{
		return ((): string => {
			let framework = _.find(this.getSupportedFrameworks().wait(), (fw: Server.FrameworkVersion) => fw.Version === version);
			if(framework) {
				return framework.DisplayName;
			}

			this.$errors.fail("Cannot find version %s in the supported versions.", version);
		}).future<string>()();
	}
	
	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return (() => {
			let projectDir = this.$project.getProjectDir().wait();
			let tnsModulesProjectPath = path.join(projectDir, "app", "tns_modules");
			let backupName = `${tnsModulesProjectPath}.backup`;
			// Check if current version is supported one. We cannot migrate ObsoleteVersions
			let currentFrameworkVersion = this.$project.projectData.FrameworkVersion;
			if(!_.contains(this.getSupportedVersions().wait(), currentFrameworkVersion)) {
				if(_.contains(this.getObsoleteVersions().wait(), currentFrameworkVersion)) {
					this.$errors.failWithoutHelp(`You can still build your project, but you cannot migrate from version '${currentFrameworkVersion}'. Consider creating a new NativeScript project.`)
				} else {
					this.$errors.failWithoutHelp(`You cannot migrate from version ${currentFrameworkVersion}.`)
				}
			}

			try {
				this.$fs.rename(tnsModulesProjectPath, backupName).wait();
				this.$fs.createDirectory(tnsModulesProjectPath).wait();
				let projectType = this.$project.isTypeScriptProject().wait() ? NativeScriptMigrationService.TYPESCRIPT_ABBREVIATION : NativeScriptMigrationService.JAVASCRIPT_ABBREVIATION;
				let pathToNewTnsModules = path.join(this.tnsModulesDirectoryPath, projectType, this.getFileNameByVersion(newVersion));
				this.$fs.unzip(pathToNewTnsModules, tnsModulesProjectPath).wait();
				this.$fs.deleteDirectory(backupName).wait();
			} catch(err) {
				this.$logger.trace("Error during migration. Trying to restore previous state.");
				this.$logger.trace(err);
				this.$fs.deleteDirectory(tnsModulesProjectPath).wait();
				this.$fs.rename(backupName, tnsModulesProjectPath).wait();
				this.$errors.failWithoutHelp("Error during migration. Restored original state of the project.");
			}
		}).future<void>()();
	}

	private downloadTnsModules(language: string, version: string): IFuture<void> {
		return (() => {
			let fileName = this.getFileNameByVersion(version);
			let filePath = path.join(this.tnsModulesDirectoryPath, language, fileName);
			this.$fs.writeFile(filePath, "").wait();
			let file = this.$fs.createWriteStream(filePath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");
			let remotePathUrl = `${this.remoteTnsModulesDirectoryPath}/${language}/${fileName}`;
			this.$httpClient.httpRequest({ url:remotePathUrl, pipeTo: file}).wait();
			fileEnd.wait();
		}).future<void>()();
	}

	private getFileNameByVersion(version: string): string {
		return `${version}.zip`;
	}
	
	private getObsoleteVersions(): IFuture<string[]> {
		return ((): string[] => {
			let migrationData = this.nativeScriptMigrationData.wait();
			return _.map(migrationData.ObsoleteVersions, obsoleteVersion => obsoleteVersion.Version);
		}).future<string[]>()();
	}

	private parseMscorlibVersion(json: any): string {
		return [json._Major, json._Minor, json._Build].join('.');
	}
}
$injector.register("nativeScriptMigrationService", NativeScriptMigrationService);
