///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import querystring = require("querystring");
import path = require("path");
var options:any = require("../options");
import MobileHelper = require("../mobile/mobile-helper");
import Future = require("fibers/future");
import helpers = require("../helpers");
import iOSDeploymentValidatorLib = require("../validators/ios-deployment-validator");
import constants = require("../mobile/constants");

export class BuildService implements Project.IBuildService {
	constructor(private $config: IConfiguration,
		private $logger: ILogger,
		private $errors: IErrors,
		private $server: Server.IServer,
		private $project: Project.IProject,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $identityManager: Server.IIdentityManager,
		private $loginManager: ILoginManager,
		private $opener: IOpener,
		private $qr: IQrCodeGenerator,
		private $resources: IResourceLoader,
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

	private getTempDir(): string {
		var dir = path.join(this.$project.getProjectDir(), ".ab");
		this.$fs.createDirectory(dir).wait();
		return dir;
	}

	private getProjectRelativePath(fullPath): string {
		var projectDir = this.$project.getProjectDir() + path.sep;
		if (!fullPath.startsWith(projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	private zipProject(): IFuture<string> {
		return (() => {
			var tempDir = this.getTempDir();

			var projectZipFile = path.join(tempDir, "Build.zip");
			this.$fs.deleteFile(projectZipFile).wait();

			var files = this.$project.enumerateProjectFiles();
			var zipOp = this.$fs.zipFiles(projectZipFile, files,
				(path) => this.getProjectRelativePath(path));

			var result = new Future<string>();
			zipOp.resolveSuccess(() => result.return(projectZipFile));
			return result.wait();
		}).future<string>()();
	}

	private requestCloudBuild(settings: Project.IBuildSettings): IFuture<Project.IBuildResult> {
		return ((): Project.IBuildResult => {
			settings.platform = MobileHelper.normalizePlatformName(settings.platform);
			var projectData = this.$project.projectData;

			var buildProperties:any = {
				Configuration: settings.configuration,
				Platform: settings.platform,

				CorePlugins: projectData.CorePlugins,
				AppIdentifier: projectData.AppIdentifier,
				ProjectName: projectData.name,
				Author: projectData.Author,
				Description: projectData.Description,
				FrameworkVersion: projectData.FrameworkVersion,
				BundleVersion: projectData.BundleVersion,
				DeviceOrientations: projectData.DeviceOrientations
			};

			if (settings.platform === "Android") {
				buildProperties.AndroidPermissions = projectData.AndroidPermissions;
				buildProperties.AndroidVersionCode = projectData.AndroidVersionCode;
				buildProperties.AndroidHardwareAcceleration = projectData.AndroidHardwareAcceleration;

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
				buildProperties.iOSDisplayName = projectData.DisplayName;
				buildProperties.iOSDeviceFamily = projectData.iOSDeviceFamily;
				buildProperties.iOSStatusBarStyle = projectData.iOSStatusBarStyle;
				buildProperties.iOSBackgroundMode = projectData.iOSBackgroundMode;

				var completeAutoselect = (!options.provision && !options.certificate);

				var provisionData: IProvision;
				if (options.provision) {
					provisionData = this.$identityManager.findProvision(options.provision).wait();
				} else {
					var deviceIdentifier = settings.device ? settings.device.getIdentifier() : undefined;
					provisionData = this.$identityManager.autoselectProvision(
						projectData.AppIdentifier, settings.provisionTypes, deviceIdentifier).wait();
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
						appIdentifier: projectData.AppIdentifier,
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
			} else if (settings.platform === "WP8") {
				buildProperties.WP8ProductID = projectData.WP8ProductID || MobileHelper.generateWP8GUID();
				buildProperties.WP8PublisherID = projectData.WP8PublisherID;
				buildProperties.WP8Publisher = projectData.WP8Publisher;
				buildProperties.WP8TileTitle = projectData.WP8TileTitle;
				buildProperties.WP8Capabilities = projectData.WP8Capabilities;
				buildProperties.WP8Requirements = projectData.WP8Requirements;
				buildProperties.WP8SupportedResolutions = projectData.WP8SupportedResolutions;
				return this.beginBuild(buildProperties).wait();
			} else {
				this.$logger.fatal("Unknown platform '%s'.", settings.platform);
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

			var result = this.buildProject(this.$project.projectData.name, this.$project.projectData.name,
				this.$config.SOLUTION_SPACE_NAME, buildProperties).wait();

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

			var templateFiles = helpers.enumerateFilesInDirectorySync(path.join(__dirname, "../../resources/qr"));
			var targetFiles = _.map(templateFiles, (file) => path.join(this.getTempDir(), path.basename(file)));

			_(_.zip(templateFiles, targetFiles)).each((zipped) => {
				var srcFile = zipped[0];
				var targetFile = zipped[1];
				this.$logger.debug("Copying '%s' to '%s'", srcFile, targetFile);
				this.$fs.copyFile(srcFile, targetFile).wait();
			});

			var scanFile = _.find(targetFiles, (file) => path.basename(file) === "scan.html");
			var htmlTemplateContents = this.$fs.readText(scanFile).wait();
			htmlTemplateContents = htmlTemplateContents.replace(/\$ApplicationName\$/g, this.$project.projectData.name)
				.replace(/\$Packages\$/g, JSON.stringify(packageDefs));
			this.$fs.writeFile(scanFile, htmlTemplateContents).wait();

			this.$logger.debug("Updated scan.html");
			this.$opener.open(scanFile);
		}).future<void>()();
	}

	public build(settings: Project.IBuildSettings): IFuture<Server.IPackageDef[]> {
		return ((): Server.IPackageDef[] => {
			this.$project.ensureProject();

			settings.configuration = settings.configuration || "Debug";
			this.$logger.info("Building project for platform '%s', configuration '%s'", settings.platform, settings.configuration);

			this.ensureAllPlatformAssets().wait();
			this.importProject().wait();

			var buildResult = this.requestCloudBuild(settings).wait();
			var packageDefs = buildResult.packageDefs;

			if (buildResult.provisionType === constants.ProvisionType.Development && !settings.downloadFiles) {
				this.$logger.info("Package built with 'Development' provision type. Downloading package, instead of generating QR code.");
				this.$logger.info("Deploy manually to your device using iTunes.");
				settings.showQrCodes = false;
				settings.downloadFiles = true;
			}

			if (settings.showQrCodes && packageDefs.length) {
				var urlKind = buildResult.provisionType === constants.ProvisionType.AdHoc ? "manifest" : "package";
				var liveSyncToken = buildResult.buildProperties.LiveSyncToken;
				packageDefs.forEach((def:any) => {
					var liveSyncUrl = this.getLiveSyncUrl(urlKind, def.relativePath, liveSyncToken).wait();
					def.qrUrl = this.$qr.generateDataUri(liveSyncUrl);
					this.$logger.debug("QR code image is '%s'", def.qrUrl);

					def.packageUrl = (urlKind !== "package")
						? this.getLiveSyncUrl("package", def.relativePath, liveSyncToken).wait()
						: liveSyncUrl;
					this.$logger.debug("Download URL is '%s'", def.packageUrl);
				});

				this.showPackageQRCodes(packageDefs).wait();
			}

			if (settings.downloadFiles) {
				packageDefs.forEach((pkg: Server.IPackageDef) => {
					var targetFileName = path.join(this.$project.getProjectDir(), path.basename(pkg.solutionPath));
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
		return options["livesync"] === false ? "Release" : "Debug";
	}

	public deploy(platform: string, device?: Mobile.IDevice): IFuture<Server.IPackageDef[]> {
		return (() => {
			platform = MobileHelper.validatePlatformName(platform, this.$errors);
			this.$project.ensureProject();
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
			platform = MobileHelper.validatePlatformName(platform, this.$errors);

			this.$project.ensureProject();

			if (options.download && options.companion) {
				this.$errors.fail("Cannot specify both --download and --companion options.");
			}

			this.$loginManager.ensureLoggedIn().wait();

			if (options.companion) {
				this.deployToIon(platform).wait();
			} else {
				if (!MobileHelper.platformCapabilities[platform].wirelessDeploy && !options.download) {
					this.$logger.info("Wireless deploying is not supported for platform %s. The package will be downloaded after build.", platform);
					options.download = true;
				}

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

	private deployToIon(platform: string): IFuture<void> {
		return (() => {
			platform = MobileHelper.validatePlatformName(platform, this.$errors);
			if (!MobileHelper.platformCapabilities[platform].companion) {
				this.$errors.fail("The companion app is not available on %s.", platform);
			}

			this.$logger.info("Deploying to AppBuilder companion app.");

			this.importProject().wait();

			var liveSyncToken = this.$server.cordova.getLiveSyncToken(this.$project.projectData.name, this.$project.projectData.name).wait();

			var hostPart = util.format("%s://%s", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
			var fullDownloadPath = util.format("icenium://%s?LiveSyncToken=%s", querystring.escape(hostPart), querystring.escape(liveSyncToken));

			this.$logger.debug("Using LiveSync URL for Ion: %s", fullDownloadPath);

			this.showPackageQRCodes([{
				platform: "AppBuilder companion app for " + platform,
				qrUrl: this.$qr.generateDataUri(fullDownloadPath),
				solution: this.$project.projectData.name
			}]).wait();
		}).future<void>()();
	}

	public importProject(): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			this.$loginManager.ensureLoggedIn().wait();

			var projectZipFile = this.zipProject().wait();
			this.$logger.debug("zipping completed, result file size: %d", this.$fs.getFileSize(projectZipFile).wait());

			this.$server.projects.importProject(this.$project.projectData.name, this.$project.projectData.name,
				this.$fs.createReadStream(projectZipFile)).wait();
			this.$logger.trace("Project imported");
		}).future<void>()();
	}

	_assetUpdateMessagePrinted = false;
	private printAssetUpdateMessage() {
		if (!this._assetUpdateMessagePrinted) {
			this.$logger.info("Setting up missing asset files. Commit these assets into your source control repository.");
			this._assetUpdateMessagePrinted = true;
		}
	}

	private ensureAllPlatformAssets(): IFuture<void> {
		return ((): void => {
			Object.keys(MobileHelper.platformCapabilities).forEach((platform) => {
				this.ensureCordovaJs(platform).wait();
			})

			var appResourcesDir = this.$resources.appResourcesDir;
			var appResourceFiles = helpers.enumerateFilesInDirectorySync(appResourcesDir);
			var projectDir = this.$project.getProjectDir();
			appResourceFiles.forEach((appResourceFile) => {
				var relativePath = path.relative(appResourcesDir, appResourceFile);
				var targetFilePath = path.join(projectDir, relativePath);
				this.$logger.trace("Checking app resources: %s must match %s", appResourceFile, targetFilePath);
				if (!this.$fs.exists(targetFilePath).wait()) {
					this.printAssetUpdateMessage();
					this.$logger.trace("File not found, copying %s", appResourceFile);
					this.$fs.copyFile(appResourceFile, targetFilePath).wait();
				}
			});
		}).future<void>()();
	}

	private ensureCordovaJs(platform: string): IFuture<void> {
		return (() => {
			var cordovaJsFileName = path.join(this.$project.getProjectDir(), util.format("cordova.%s.js", platform).toLowerCase());
			if (!this.$fs.exists(cordovaJsFileName).wait()) {
				this.printAssetUpdateMessage();
				var cordovaJsSourceFilePath = this.$resources.buildCordovaJsFilePath(
					this.$project.projectData.FrameworkVersion, platform);
				this.$fs.copyFile(cordovaJsSourceFilePath, cordovaJsFileName).wait();
			}
		}).future<void>()();
	}
}
$injector.register("buildService", BuildService);

helpers.registerCommand("buildService", "build", (buildService, args) => buildService.executeBuild(args[0]));
helpers.registerCommand("buildService", "cloud-sync", (buildService, args) => buildService.importProject());
