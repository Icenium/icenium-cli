///<reference path=".d.ts"/>

"use strict";

import rimraf = require("rimraf");
import xml2js = require("xml2js");
import path = require("path");
import unzip = require("unzip");
import _ = require("underscore");
import minimatch = require("minimatch");
var options:any = require("./options");
import util = require("util");
import helpers = require("./helpers");
import querystring = require("querystring");
import Future = require("fibers/future");
import projectNameValidator = require("./validators/project-name-validator");
import MobileHelper = require("./mobile/mobile-helper");
import iOSDeploymentValidatorLib = require("./validators/ios-deployment-validator");
import constants = require("./mobile/constants");

export class BuildService implements Project.IBuildService {
	constructor(private $config: IConfiguration,
		private $logger: ILogger,
		private $server: Server.IServer,
		private $projectNameValidator) { }

	public getLiveSyncUrl(urlKind: string, filesystemPath: string, liveSyncToken: string): IFuture<string> {
		return ((): string => {
			urlKind = urlKind.toLowerCase();
			if (urlKind !== "manifest" && urlKind !== "package") {
				throw new Error("urlKind must be either 'manifest' or 'package'");
			}

			// escape URLs twice to work around a bug in bit.ly
			var fullDownloadPath = util.format("%s://%s/Mist/MobilePackage/%s?packagePath=%s&token=%s",
				this.$config.AB_SERVER_PROTO,
				this.$config.AB_SERVER, urlKind,
				querystring.escape(querystring.escape(filesystemPath)),
				querystring.escape(querystring.escape(liveSyncToken)));
			this.$logger.debug("Minifying LiveSync URL '%s'", fullDownloadPath);

			var url = this.$server.cordova.getLiveSyncUrl(fullDownloadPath).wait();
			if (urlKind === "manifest") {
				url = "itms-services://?action=download-manifest&amp;url=" + querystring.escape(url);
			}

			this.$logger.debug("Device install URL '%s'", url);

			return url;
		}).future<string>()();
	}

	public buildProject(solutionName, projectName, solutionSpace, buildProperties): IFuture<Server.IBuildResult> {
		return ((): Server.IBuildResult => {
			this.$logger.info("Building project %s/%s (%s)", solutionName, projectName, solutionSpace);

			this.$projectNameValidator.validate(projectName);

			this.$server.projects.setProjectProperty(solutionName, projectName, { AppIdentifier: buildProperties.AppIdentifier }).wait();

			var liveSyncToken = this.$server.cordova.getLiveSyncToken(solutionName, projectName).wait();

			buildProperties.LiveSyncToken = liveSyncToken;

			var body = this.$server.build.buildProject(solutionName, projectName, {Properties: buildProperties}).wait();

			if (body.Errors.length) {
				this.$logger.error("Build errors: %s", body.Errors);
			}

			var buildResults: Server.IPackageDef[] = body.ResultsByTarget.Build.Items.map(function(buildResult) {
				var fullPath = buildResult.FullPath.replace(/\\/g, "/");
				var solutionPath = util.format("%s/%s", projectName, fullPath);

				return {
					platform: buildResult.Platform,
					solution: solutionName,
					solutionPath: solutionPath,
					relativePath: buildResult.FullPath
				};
			});

			return {
				buildResults: buildResults,
				output: body.Output
			};
		}).future<Server.IBuildResult>()();
	}
}
$injector.register("buildService", BuildService);

export class Project implements Project.IProject {
	private cachedProjectDir: string = "";
	public projectData: IProjectData;

	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $server: Server.IServer,
		private $identityManager: Server.IIdentityManager,
		private $buildService: Project.IBuildService,
		private $projectNameValidator,
		private $errors: IErrors,
		private $opener: IOpener,
		private $userDataStore: IUserDataStore,
		private $loginManager: ILoginManager) {
		this.readProjectData().wait();
	}

	public getProjectDir(): string {
		if (this.cachedProjectDir !== "") {
			return this.cachedProjectDir;
		}
		this.cachedProjectDir = null;

		var projectDir = path.resolve(options.path || ".");
		while (true) {
			this.$logger.trace("Looking for project in '%s'", projectDir);

			if (this.$fs.exists(path.join(projectDir, this.$config.PROJECT_FILE_NAME)).wait()) {
				this.$logger.debug("Project directory is '%s'.", projectDir);
				this.cachedProjectDir = projectDir;
				break;
			}

			var dir = path.dirname(projectDir);
			if (dir === projectDir) {
				this.$logger.debug("No project found at or above '%s'.", path.resolve("."));
				break;
			}
			projectDir = dir;
		}

		return this.cachedProjectDir;
	}

	private getTempDir(): string {
		var dir = path.join(this.getProjectDir(), ".ab");
		this.$fs.createDirectory(dir).wait();
		return dir;
	}

	private getProjectRelativePath(fullPath): string {
		var projectDir = this.getProjectDir() + path.sep;
		if (!fullPath.startsWith(projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	private static INTERNAL_NONPROJECT_FILES = [".ab", ".abproject", "*.ipa", "*.apk"];

	public enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): string[] {
		var excludedProjectDirsAndFiles = Project.INTERNAL_NONPROJECT_FILES.
			concat(additionalExcludedProjectDirsAndFiles || []);

		var projectDir = this.getProjectDir();
		var projectFiles = helpers.enumerateFilesInDirectorySync(projectDir, (filePath) => {
			return !this.isFileExcluded(path.relative(projectDir, filePath), excludedProjectDirsAndFiles);
		});

		this.$logger.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));
		return projectFiles;
	}

	public isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean {
		var excludedProjectDirsAndFiles = Project.INTERNAL_NONPROJECT_FILES.
			concat(additionalExcludedDirsAndFiles || []);

		var relativeToProjectPath = path.relative(projectDir, filePath);
		return this.isFileExcluded(relativeToProjectPath, excludedProjectDirsAndFiles);
	}

	private isFileExcluded(path: string, exclusionList: string[]): boolean {
		return Boolean(_.find(exclusionList, (pattern) => minimatch(path, pattern, {nocase: true})));
	}

	private zipProject(): IFuture<string> {
		return (() => {
			var tempDir = this.getTempDir();

			var projectZipFile = path.join(tempDir, "Build.zip");
			this.$fs.deleteFile(projectZipFile).wait();

			var files = this.excludeIgnoredFiles(this.enumerateProjectFiles());

			var zipOp = this.$fs.zipFiles(projectZipFile, files,
				(path) => this.getProjectRelativePath(path));

			var result = new Future<string>();
			zipOp.resolveSuccess(() => result.return(projectZipFile));
			return result.wait();
		}).future<string>()();
	}

	private excludeIgnoredFiles(files: string[]) :string[] {

		var ignorePaths = this.projectData.ignorePaths || [];

		var selectedFiles = _.reject(files, (file: string) => {
			var match = _.select(ignorePaths, (ignorePath: string) => {
				if (minimatch(file, ignorePath)) {
					return true;
				}
			});

			if (match.length !== 0) {
				return true;
			}
		});

		return selectedFiles;
	}

	private requestCloudBuild(settings: Project.IBuildSettings): IFuture<Project.IBuildResult> {
		return ((): Project.IBuildResult => {
			settings.platform = MobileHelper.normalizePlatformName(settings.platform);

			var buildProperties:any = {
				Configuration: settings.configuration,
				Platform: settings.platform,

				CorePlugins: this.projectData.CorePlugins,
				AppIdentifier: this.projectData.AppIdentifier,
				ProjectName: this.projectData.name,
				FrameworkVersion: this.projectData.FrameworkVersion,
				BundleVersion: this.projectData.BundleVersion,
				DeviceOrientations: this.projectData.DeviceOrientations
			};

			if (settings.platform === "Android") {
				buildProperties.AndroidPermissions = this.projectData.AndroidPermissions;
				buildProperties.AndroidVersionCode = this.projectData.AndroidVersionCode;
				buildProperties.AndroidHardwareAcceleration = this.projectData.AndroidHardwareAcceleration;

				if (options.certificate) {
					var certificateData = this.$identityManager.findCertificate(options.certificate).wait();
					buildProperties.AndroidCodesigningIdentity = certificateData.Alias;
					this.$logger.info("Using certificate '%s'", certificateData.Alias);
				} else {
					buildProperties.AndroidCodesigningIdentity = "";
				}

				var result = this.beginBuild(buildProperties).wait();
				return result;
			} else if (settings.platform === "iOS" ) {
				buildProperties.iOSDisplayName = this.projectData.DisplayName;
				buildProperties.iOSDeviceFamily = this.projectData.iOSDeviceFamily;
				buildProperties.iOSStatusBarStyle = this.projectData.iOSStatusBarStyle;
				buildProperties.iOSBackgroundMode = this.projectData.iOSBackgroundMode;

				var completeAutoselect = (!options.provision && !options.certificate);

				var provisionData: IProvision;
				if (options.provision) {
					provisionData = this.$identityManager.findProvision(options.provision).wait();
				} else {
					var deviceIdentifier = settings.device ? settings.device.getIdentifier() : undefined;
					provisionData = this.$identityManager.autoselectProvision(
						this.projectData.AppIdentifier, settings.provisionTypes, deviceIdentifier).wait();
					options.provision = provisionData.Name;
				}
				this.$logger.info("Using mobile provision '%s'", provisionData.Name);

				var certificateData: ICryptographicIdentity;
				if (options.certificate) {
					certificateData = this.$identityManager.findCertificate(options.certificate).wait();
				} else {
					certificateData = this.$identityManager.autoselectCertificate(provisionData).wait();
					options.certificate = certificateData.Alias;
				}
				this.$logger.info("Using certificate '%s'", certificateData.Alias);

				if (!completeAutoselect) {
					var iOSDeploymentValidator = this.$injector.resolve(iOSDeploymentValidatorLib.IOSDeploymentValidator, {
						appIdentifier: this.projectData.AppIdentifier,
						deviceIdentifier: settings.device ? settings.device.getIdentifier() : null
					});
					iOSDeploymentValidator.throwIfInvalid(
						{provisionOption: options.provision, certificateOption: options.certificate}).wait();
				}

				buildProperties.MobileProvisionIdentifier = provisionData.Identifier;
				buildProperties.iOSCodesigningIdentity = certificateData.Alias;

				var buildResult = this.beginBuild(buildProperties).wait();
				buildResult.provisionType = provisionData.ProvisionType;
				return buildResult;
			} else {
				this.$logger.fatal("Unknown platform '%s'. Must be either 'Android' or 'iOS'", settings.platform);
				return null;
			}
		}).future<Project.IBuildResult>()();
	}

	private beginBuild(buildProperties: any): IFuture<Project.IBuildResult> {
		return ((): Project.IBuildResult => {
			Object.keys(buildProperties).forEach((prop) => {
				if (buildProperties[prop] === undefined) {
					throw new Error(util.format("Build property '%s' is undefined.", prop));
				}

				if (_.isArray(buildProperties[prop])) {
					buildProperties[prop] = buildProperties[prop].join(";");
				}
			});

			var result = this.$buildService.buildProject(this.projectData.name, this.projectData.name, this.$config.SOLUTION_SPACE_NAME, buildProperties).wait();

			if (result.output) {
				var buildLogFilePath = path.join(this.getTempDir(), "build.log");
				this.$fs.writeFile(buildLogFilePath, result.output).wait();
				this.$logger.info("Build log written to '%s'", buildLogFilePath);
			}

			this.$logger.debug(result.buildResults);

			return {
				buildProperties: buildProperties,
				packageDefs: result.buildResults
			};
		}).future<Project.IBuildResult>()();
	}

	private showPackageQRCodes(packageDefs): IFuture<void> {
		return (() => {
			if (!packageDefs.length) {
				return;
			}

			var templateFiles = helpers.enumerateFilesInDirectorySync(path.join(__dirname, "../resources/qr"));
			var targetFiles = _.map(templateFiles, (file) => path.join(this.getTempDir(), path.basename(file)));

			var copyOps = _(_.zip(templateFiles, targetFiles)).map((zipped) => {
				var srcFile = zipped[0];
				var targetFile = zipped[1];
				this.$logger.debug("Copying '%s' to '%s'", srcFile, targetFile);
				return this.$fs.copyFile(srcFile, targetFile);
			});
			Future.wait(copyOps);

			var scanFile = _.find(targetFiles, (file) => path.basename(file) === "scan.html");
			var htmlTemplateContents = this.$fs.readText(scanFile).wait();
			htmlTemplateContents = htmlTemplateContents.replace(/\$ApplicationName\$/g, this.projectData.name)
				.replace(/\$Packages\$/g, JSON.stringify(packageDefs));
			this.$fs.writeFile(scanFile, htmlTemplateContents).wait();

			this.$logger.debug("Updated scan.html");
			this.$opener.open(scanFile);
		}).future<void>()();
	}

	build(settings: Project.IBuildSettings): IFuture<Server.IPackageDef[]> {
		return ((): Server.IPackageDef[] => {
			this.ensureProject();

			settings.configuration = settings.configuration || "Debug";
			this.$logger.info("Building project for platform '%s', configuration '%s'", settings.platform, settings.configuration);

			this.importProject().wait();

			var buildResult = this.requestCloudBuild(settings).wait();
			var packageDefs = buildResult.packageDefs;

			if (settings.showQrCodes && packageDefs.length) {
				var urlKind = buildResult.provisionType === "AdHoc" ? "manifest" : "package";
				packageDefs.forEach((def:any) => {
					var liveSyncUrl = this.$buildService.getLiveSyncUrl(urlKind, def.relativePath, buildResult.buildProperties.LiveSyncToken).wait();
					def.qrUrl = helpers.createQrUrl(liveSyncUrl);

					this.$logger.debug("QR URL is '%s'", def.qrUrl);
				});

				this.showPackageQRCodes(packageDefs).wait();
			}

			if (settings.downloadFiles) {
				packageDefs.forEach((pkg: Server.IPackageDef) => {
					var targetFileName = path.join(this.getProjectDir(), path.basename(pkg.solutionPath));
					this.$logger.info("Downloading file '%s/%s' into '%s'", pkg.solution, pkg.solutionPath, targetFileName);
					var targetFile = this.$fs.createWriteStream(targetFileName);
					this.$server.filesystem.getContent(pkg.solution, pkg.solutionPath, targetFile).wait();
					this.$logger.info("Download completed: %s", targetFileName);
					pkg.localFile = targetFileName;
				});
			}

			return packageDefs;
		}).future<Server.IPackageDef[]>()();
	}

	private getBuildConfiguration(): string {
		return options["no-livesync"] ? "Release" : "Debug";
	}

	public deploy(platform: string, device?: Mobile.IDevice): IFuture<Server.IPackageDef[]> {
		return (() => {
			this.validatePlatform(platform);
			this.ensureProject();
			var result = this.build({platform: platform,
				configuration: this.getBuildConfiguration(),
				downloadFiles: true,
				provisionTypes: [constants.ProvisionType.AdHoc, constants.ProvisionType.Development],
				device: device
			}).wait();
			return result;
		}).future<Server.IPackageDef[]>()();
	}

	public executeBuild(platform: string): IFuture<void> {
		return (() => {
			this.validatePlatform(platform);

			this.ensureProject();

			if (options.download && options.companion) {
				this.$errors.fail("Cannot specify both --download and --companion options.");
			}

			this.$loginManager.ensureLoggedIn().wait();

			if (options.companion) {
				this.deployToIon(platform).wait();
			} else {
				var willDownload = options.download;
				var provisionTypes = [constants.ProvisionType.AdHoc];
				if (willDownload) {
					provisionTypes.push(constants.ProvisionType.Development);
				}

				this.build({platform: platform,
					configuration: this.getBuildConfiguration(),
					showQrCodes: !options.download,
					downloadFiles: options.download,
					provisionTypes: provisionTypes
				}).wait();
			}
		}).future<void>()();
	}

	private validatePlatform(platform: string): void {
		if (!platform || (!MobileHelper.isiOSPlatform(platform) && !MobileHelper.isAndroidPlatform(platform))) {
			this.$errors.fail("Incorrect platform '%s' specified.", platform);
		}
	}

	private deployToIon(platform: string): IFuture<void> {
		return (() => {
			platform = MobileHelper.normalizePlatformName(platform);
			if (platform.toLowerCase() !== "ios") {
				this.$errors.fail("The companion app is supported only on iOS.");
			}

			this.$logger.info("Deploying to AppBuilder companion app.");

			this.importProject().wait();

			var liveSyncToken = this.$server.cordova.getLiveSyncToken(this.projectData.name, this.projectData.name).wait();

			var hostPart = util.format("%s://%s", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
			var fullDownloadPath = util.format("icenium://%s?LiveSyncToken=%s", querystring.escape(hostPart), querystring.escape(liveSyncToken));

			this.$logger.debug("Using LiveSync URL for Ion: %s", fullDownloadPath);

			this.showPackageQRCodes([{
				platform: "AppBuilder companion app for " + platform,
				qrUrl: helpers.createQrUrl(fullDownloadPath),
				solution: this.projectData.name
			}]).wait();
		}).future<void>()();
	}

	public importProject(): IFuture<void> {
		return (() => {
			this.ensureProject();

			this.$loginManager.ensureLoggedIn().wait();

			var projectZipFile = this.zipProject().wait();
			this.$logger.debug("zipping completed, result file size: %d", this.$fs.getFileSize(projectZipFile).wait());

			this.$server.projects.importProject(this.projectData.name, this.projectData.name, this.$fs.createReadStream(projectZipFile)).wait();
			this.$logger.trace("Project imported");
		}).future<void>()();
	}

	public saveProject(projectDir: string): IFuture<void> {
		return this.$fs.writeJson(path.join(projectDir, this.$config.PROJECT_FILE_NAME), this.projectData, "\t");
	}

	private readProjectData(): IFuture<void> {
		return (() => {
			var projectDir = this.getProjectDir();
			if (projectDir) {
				this.projectData = this.$fs.readJson(path.join(projectDir, this.$config.PROJECT_FILE_NAME)).wait();

				var blob: any = this.projectData;
				if (blob.hasOwnProperty("iOSDisplayName")) {
					blob.DisplayName = blob.iOSDisplayName;
					delete blob.iOSDisplayName;
				}
			}
		}).future<void>()();
	}

	public createNewProject(projectName: string): IFuture<void> {
		return ((): void => {
			var projectDir = this.getNewProjectDir();

			if (!projectName) {
				projectName = this.createProjectName(projectDir).wait();
			}

			this.createFromTemplate(projectName, projectDir).wait();
		}).future<void>()();
	}

	public createProjectFileFromExistingProject(): IFuture<void> {
		return ((): void => {
			var projectDir = this.getNewProjectDir();
			var projectFile = path.join(projectDir, this.$config.PROJECT_FILE_NAME);
			if (this.$fs.exists(projectFile).wait()) {
				this.$errors.fail({ formatStr: "The specified folder is already an AppBuilder command line project!", suppressCommandHelp: true });
			}
			var appname = path.basename(projectDir);
			var properties = this.getProjectPropertiesFromExistingProject(projectDir, appname).wait();
			if (!properties) {
				properties = this.alterPropertiesForNewProject({}, appname);
			}

			try {
				this.createProjectFile(projectDir, appname, properties).wait();
				this.$logger.info("Successfuly initialised project in the folder!");
			}
			catch (ex) {
				this.$logger.error("There was an error while initialising the project:");
				throw ex;
			}

		}).future<void>()();
	}

	private getProjectPropertiesFromExistingProject(projectDir: string, appname: string): IFuture<any> {
		return ((): any => {
			var vseProjectFilepath = path.join(projectDir, appname + ".iceproj");
			var githubProjectFilepath = path.join(projectDir, appname + ".proj");

			if (this.$fs.exists(vseProjectFilepath).wait()) {
				return this.getProjectProperties(vseProjectFilepath, appname).wait();
			}

			if (this.$fs.exists(githubProjectFilepath).wait()) {
				return this.getProjectProperties(githubProjectFilepath, appname).wait();
			}

			this.$logger.warn("No AppBuilder project file found in folder. Creating project with default settings!");
			return null;
		}).future<any>()();
	}

	private createProjectName(projectDir): IFuture<string> {
		return ((): string => {
			var files = this.$fs.readDirectory(projectDir).wait();
			var defaultProjectName = this.$config.DEFAULT_PROJECT_NAME;

			files = _.map(files, (f) => path.basename(f));

			if (!_.contains(files, defaultProjectName)) {
				return defaultProjectName;
			}

			for (var i = 0; ; ++i) {
				var nameWithIndex = util.format("%s%s", defaultProjectName, i);
				if (!_.contains(files, nameWithIndex)) {
					return nameWithIndex;
				}
			}
		}).future<string>()();
	}

	private createFromTemplate(appname, projectDir): IFuture<void> {
		return (() => {
			var templatesDir = path.join(__dirname, "../resources/templates"),
				template = options.template || this.$config.DEFAULT_PROJECT_TEMPLATE,
				templateFileName;

			if (template.toLowerCase() === "kendouidataviz") {
				this.$loginManager.ensureLoggedIn().wait();
				var user = this.$userDataStore.getUser().wait();
				if (!user.tenant.features["Kendo UI DataViz"]) {
					this.$errors.fail("You cannot create Kendo UI DataViz projects " +
						"with your current subscription plan. To use this feature, " +
						"upgrade your subscription plan to Business or greater, " +
						"or contact the account owner.\n" +
						"http://www.telerik.com/purchase/platform");
				}
			}

			if (!appname) {
				this.$logger.fatal("At least appname must be specified!");
				return;
			}
			projectDir = path.join(projectDir, appname);

			this.$projectNameValidator.validate(appname);
			templateFileName = path.join(templatesDir, "Telerik.Mobile.Cordova." + template + ".zip");
			this.$logger.trace("Using template '%s'", templateFileName);
			if (this.$fs.exists(templateFileName).wait()) {
				this.$logger.trace("Creating template folder '%s'", projectDir);
				this.createTemplateFolder(projectDir).wait();
				try {
					this.$logger.trace("Extracting template from '%s'", templateFileName);
					this.extractTemplate(templateFileName, projectDir).wait();
					this.$logger.trace("Reading template project properties.");
					var properties = this.getProjectProperties(path.join(projectDir, "mobile.proj"), appname).wait();
					properties = this.alterPropertiesForNewProject(properties, appname);
					this.$logger.trace(properties);
					this.$logger.trace("Creating project file.");
					this.createProjectFile(projectDir, appname, properties).wait();
					this.$logger.trace("Removing unnecessary files from template.");
					this.removeExtraFiles(projectDir).wait();

					this.$logger.info("%s has been successfully created.", appname);
				}
				catch (ex) {
					Future.wrap(rimraf)(projectDir).wait();
					throw ex;
				}
			} else {
				var message =
					["The requested template " + options.template + " does not exist.",
					"Available templates are:"];
				this.$config.TEMPLATE_NAMES.forEach((item) => {
					message.push("  " + item);
				});
				this.$errors.fail({formatStr: message.join("\n"), suppressCommandHelp: true});
			}
		}).future<void>()();
	}

	private removeExtraFiles(projectDir): IFuture<any> {
		return ((): any => {
			Future.wait(_.map(["mobile.proj", "mobile.vstemplate"],
				(file) => this.$fs.deleteFile(path.join(projectDir, file))));
		}).future<any>()();
	}

	private getProjectProperties(projectFile, appName): IFuture<any> {
		return ((): any => {
			var properties: any = {};

			var parser = new xml2js.Parser();
			var contents = this.$fs.readText(projectFile).wait();

			var parseString = Future.wrap(function (str, callback) {
				return parser.parseString(str, callback);
			});

			var result: any = parseString(contents).wait();
			var propertyGroup: any = result.Project.PropertyGroup[0];

			properties.name = propertyGroup.ProjectName[0];
			properties.AppIdentifier = propertyGroup.AppIdentifier[0];
			properties.BundleVersion = propertyGroup.BundleVersion[0];
			properties.CorePlugins = propertyGroup.CorePlugins[0];
			properties.DeviceOrientations = propertyGroup.DeviceOrientations[0];
			properties.FrameworkVersion = propertyGroup.FrameworkVersion[0];
			properties.iOSStatusBarStyle = propertyGroup.iOSStatusBarStyle[0];
			properties.AndroidPermissions = propertyGroup.AndroidPermissions[0];

			return properties;
		}).future<any>()();
	}

	private alterPropertiesForNewProject(properties, projectName: string): any {
		properties.name = projectName;
		var appid = options.appid;
		if (!options.appid) {
			appid = this.generateDefaultAppId(projectName);
			this.$logger.warn("--appid was not specified. Defaulting to " + appid)
		}
		properties.AppIdentifier = appid;

		return properties;
	}

	private getNewProjectDir() {
		return options.path || process.cwd();
	}

	public createProjectFile(projectDir: string, projectName: string, properties: any): IFuture<void> {
		return ((): void => {
			properties = properties || {};
			var updateData;

			this.$fs.createDirectory(projectDir).wait();
			this.cachedProjectDir = projectDir;
			this.projectData = this.$fs.readJson(path.join(__dirname, "../resources/default-project.json")).wait();

			var projectSchema = helpers.getProjectFileSchema();
			Object.keys(properties).forEach(prop => {
				if (projectSchema.hasOwnProperty(prop)) {
					if(projectSchema[prop].flags) {
						this.projectData[prop] = properties[prop].split(";");
						updateData = this.projectData[prop];
					} else {
						this.projectData[prop] = properties[prop];
						updateData = [this.projectData[prop]];
					}

					//triggers validation logic
					this.updateProjectProperty({}, "set", prop, updateData, false);
				}
			});

			if (!this.projectData.DisplayName) {
				this.projectData.DisplayName = this.projectData.name;
			}

			this.saveProject(projectDir).wait();
		}).future<void>()();
	}

	public createTemplateFolder(projectDir: string): IFuture<any> {
		return ((): any => {
			this.$fs.createDirectory(projectDir).wait();
			var projectDirFiles = this.$fs.readDirectory(projectDir).wait();
			if (projectDirFiles.length != 0) {
				throw new Error("The specified directory must be empty to create a new project.");
			}
		}).future<any>()();
	}

	private extractTemplate(templateFileName, projectDir: string): IFuture<any> {
		return this.$fs.futureFromEvent(
			this.$fs.createReadStream(templateFileName)
			.pipe(unzip.Extract({ path: projectDir })), "close");
	}

	private generateDefaultAppId(appName: string): string {
		var sanitizedName = _.filter(appName.split(""), (c) => /[a-zA-Z0-9]/.test(c)).join("");
		if (sanitizedName) {
			if (/^\d+$/.test(sanitizedName)) {
				sanitizedName = "the" + sanitizedName;
			}
			return "com.telerik." + sanitizedName;
		} else {
			return "com.telerik.the";
		}
	}

	private normalizePropertyName(property) {
		if (!property) {
			return property;
		}

		var propSchema = helpers.getProjectFileSchema();
		var propLookup = helpers.toHash(propSchema,
			function(value, key) { return key.toLowerCase(); },
			function(value, key) { return key; });
		return propLookup[property.toLowerCase()] || property;
	}

	public updateProjectProperty(projectData: any, mode: string, property: string, newValue: any, useMapping: boolean = true) {
		property = this.normalizePropertyName(property);
		var propSchema = helpers.getProjectFileSchema();
		var propData = propSchema[property];

		var validate = (condition: boolean, ...args) => {
			if(condition) {
				if(propData.validationMessage) {
					this.$errors.fail(propData.validationMessage);
				} else {
					this.$errors.fail.apply(null, _.rest(args, 0));
				}
			}
		};

		if (!propData) {
				this.$logger.fatal("Unrecognized property '%s'", property);
				this.printProjectSchemaHelp();
			return;
		}

		if (!propData.flags) {
			if (newValue.length !== 1) {
				this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
			}
			if (mode === "add" || mode === "del") {
				this.$errors.fail("Property '%s' is not a collection of flags. Use prop-set to set a property value.", property);
			}
		} else {
			newValue = _.flatten(_.map(newValue, function(value:string) { return value.split(";"); }));
		}

		var range = propData.range;
		if (range) {
			newValue = _.map(newValue, function(value:string) { return value.toLowerCase(); });

			var validValues;
			if (_.isArray(range)) {
				validValues = helpers.toHash(range,
					function(value) { return value.toLowerCase(); },
					_.identity);
			} else {
				validValues = helpers.toHash(range,
					function (value, key) {
						var result;
						if (useMapping && value.input) {
							result = value.input;
						} else {
							result = key;
						}

						return result.toLowerCase();
					},
					function(value, key) { return key; });
			}

			var badValues = _.reject(newValue, function(value) {
				return validValues[value];
			});

			validate(badValues.length > 0, "Invalid property value%s: %s", badValues.length > 1 ? "s" : "", badValues.join("; "));

			newValue = _.map(newValue, function(value) { return validValues[value]; });
		}

		if (!propData.flags) {
			newValue = newValue[0];

			if (propData.regex) {
				var matchRegex = new RegExp(propData.regex);
				validate(!matchRegex.test(newValue), "Value '%s' is not in the format expected by property %s. Expected to match /%s/", newValue, property, propData.regex);
			}

			if (propData.validator) {
				var validator = this.$injector.resolve(propData.validator);
				validator.validate(newValue);
			}
		}

		var propertyValue = projectData[property];
		if (propData.flags && _.isString(propertyValue)) {
			propertyValue = propertyValue.split(";");
		}

		if (mode === "set") {
			propertyValue = newValue;
		} else if (mode === "del") {
			propertyValue = _.difference(propertyValue, newValue);
		} else if (mode === "add") {
			propertyValue = _.union(propertyValue, newValue);
		} else {
			this.$errors.fail("Unknown property update mode '%s'", mode);
		}

		if (propertyValue.sort) {
			propertyValue.sort();
		}

		projectData[property] = propertyValue;
	}

	public updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void> {
		return (() => {
			this.ensureProject();

			this.updateProjectProperty(this.projectData, mode, propertyName, propertyValues, true);
			this.printProjectProperty(propertyName).wait();
			this.saveProject(this.getProjectDir()).wait();
		}).future<void>()();
	}

	public printProjectProperty(property: string): IFuture<void> {
		return (() => {
			this.ensureProject();
			property = this.normalizePropertyName(property);

			if (this.projectData[property]) {
				this.$logger.out(this.projectData[property]);
			} else {
				this.$logger.fatal("Unrecognized property '%s'", property);
				this.printProjectSchemaHelp();
			}
		}).future<void>()();
	}

	public getProjectSchemaHelp(): string {
		var schema = helpers.getProjectFileSchema();
		var help = ["Project properties:"];
		_.each(schema, (value:any, key) => {
			help.push(util.format("  %s - %s", key, value.description));
			if (value.range) {
				help.push("    Valid values:");
				_.each(value.range, (rangeDesc:any, rangeKey) => {
					var desc = "      " + (_.isArray(value.range) ? rangeDesc : rangeDesc.input || rangeKey);
					if (rangeDesc.description) {
						desc += " - " + rangeDesc.description;
					}
					help.push(desc);
				});
			}
			if (value.validationMessage) {
				help.push("    " + value.validationMessage.replace("\n", "\n    "));
			}
			else if (value.regex) {
				help.push("    Valid values match /" + value.regex.toString() + "/");
			}
		});

		return help.join("\n");
	}

	private printProjectSchemaHelp() {
		this.$logger.out(this.getProjectSchemaHelp());
	}

	public ensureProject() {
		if (!this.projectData) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}
	}
}
$injector.register("project", Project);

helpers.registerCommand("project", "build", (project, args) => project.executeBuild(args[0]));
helpers.registerCommand("project", "cloud-sync", (project, args) => project.importProject());
helpers.registerCommand("project", "create", (project, args) => project.createNewProject(args[0]));
helpers.registerCommand("project", "init", (project, args) => project.createProjectFileFromExistingProject());
_.each(["add", "set", ["del", "rm"], ["del", "remove"]], (operation) => {
	var propOperation = operation;
	if (_.isArray(operation)) {
		propOperation = operation[1];
		operation = operation[0];
	}

	helpers.registerCommand("project", "prop-" + propOperation,
		(project, args) => project.updateProjectPropertyAndSave(operation, args[0], _.rest(args, 1)));
});
helpers.registerCommand("project", "prop-print", (project, args) => project.printProjectProperty(args[0]));
