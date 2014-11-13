///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import querystring = require("querystring");
import path = require("path");
var options: any = require("../options");
import MobileHelper = require("../common/mobile/mobile-helper");
import Future = require("fibers/future");
import commonHelpers = require("../common/helpers");
import helpers = require("../helpers");
import iOSDeploymentValidatorLib = require("../validators/ios-deployment-validator");
import constants = require("../common/mobile/constants");
import AppIdentifier = require("../common/mobile/app-identifier");

class BuildPropertiesAdjustment implements Project.IBuildPropertiesAdjustment {
	constructor(private $project: Project.IProject,
				private $projectTypes: IProjectTypes) {
	}

	private adjustBuildPropertiesCordova(buildProperties: any): any {
		buildProperties.CorePlugins = this.$project.projectData.CorePlugins;
		return buildProperties;
	}

	private adjustBuildPropertiesNativeScript(buildProperties: any): any {
		return buildProperties;
	}

	public adjustBuildProperties(oldBuildProperties: any): any {
		if (this.$project.projectType === this.$projectTypes.Cordova) {
			return this.adjustBuildPropertiesCordova(oldBuildProperties);
		} else if (this.$project.projectType === this.$projectTypes.NativeScript) {
			return this.adjustBuildPropertiesNativeScript(oldBuildProperties);
		}
	}
}
$injector.register("buildPropertiesAdjustment", BuildPropertiesAdjustment);

export class BuildService implements Project.IBuildService {
	private static WinPhoneAetPath = "appbuilder/install/WinPhoneAet";

	constructor(private $config: IConfiguration,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger,
		private $errors: IErrors,
		private $server: Server.IServer,
		private $project: Project.IProject,
		private $buildPropertiesAdjustment: Project.IBuildPropertiesAdjustment,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $identityManager: Server.IIdentityManager,
		private $loginManager: ILoginManager,
		private $opener: IOpener,
		private $qr: IQrCodeGenerator,
		private $platformMigrator: Project.IPlatformMigrator,
		private $projectNameValidator: IProjectNameValidator) { }

	public getLiveSyncUrl(urlKind: string, filesystemPath: string, liveSyncToken: string): IFuture<string> {
		return ((): string => {
			urlKind = urlKind.toLowerCase();
			if(urlKind !== "manifest" && urlKind !== "package") {
				throw new Error("urlKind must be either 'manifest' or 'package'");
			}

			// escape URLs twice to work around a bug in bit.ly
			var fullDownloadPath = util.format("%s://%s/appbuilder/Mist/MobilePackage/%s?packagePath=%s&token=%s",
				this.$config.AB_SERVER_PROTO,
				this.$config.AB_SERVER, urlKind,
				querystring.escape(querystring.escape(filesystemPath)),
				querystring.escape(querystring.escape(liveSyncToken)));
			this.$logger.debug("Minifying LiveSync URL '%s'", fullDownloadPath);

			var url = this.$server.cordova.getLiveSyncUrl(fullDownloadPath).wait();
			if(urlKind === "manifest") {
				url = "itms-services://?action=download-manifest&amp;url=" + querystring.escape(url);
			}

			this.$logger.debug("Device install URL '%s'", url);

			return url;
		}).future<string>()();
	}

	public buildProject(solutionName: string, projectName: string, solutionSpace: string, buildProperties: any): IFuture<Server.IBuildResult> {
		return ((): Server.IBuildResult => {
			this.$logger.info("Building project %s/%s (%s)", solutionName, projectName, solutionSpace);

			this.$projectNameValidator.validate(projectName);

			this.$server.projects.setProjectProperty(solutionName, projectName, buildProperties.Configuration,{ AppIdentifier: buildProperties.AppIdentifier }).wait();

			var liveSyncToken = this.$server.cordova.getLiveSyncToken(solutionName, projectName).wait();
			buildProperties.LiveSyncToken = liveSyncToken;

			var body = this.$server.build.buildProject(solutionName, projectName, { Properties: buildProperties, Targets: []}).wait();

			var buildResults: Server.IPackageDef[] = body.ResultsByTarget["Build"].Items.map((buildResult: any) => {
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
				output: body.Output,
				errors: body.Errors.map(error => error.Message)
			};
		}).future<Server.IBuildResult>()();
	}

	private getProjectRelativePath(fullPath: string, projectDir: string): string {
		projectDir = path.join(projectDir, path.sep);
		if(!fullPath.startsWith(projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	private zipProject(): IFuture<string> {
		return (() => {
			var tempDir = this.$project.getTempDir().wait();

			var projectZipFile = path.join(tempDir, "Build.zip");
			this.$fs.deleteFile(projectZipFile).wait();
			var projectDir = this.$project.getProjectDir().wait();

			var files = this.$project.enumerateProjectFiles().wait();
			var zipOp = this.$fs.zipFiles(projectZipFile, files,
				p => this.getProjectRelativePath(p, projectDir));

			var result = new Future<string>();
			zipOp.resolveSuccess(() => result.return(projectZipFile));
			return result.wait();
		}).future<string>()();
	}

	private requestCloudBuild(settings: Project.IBuildSettings): IFuture<Project.IBuildResult> {
		return ((): Project.IBuildResult => {
			settings.platform = MobileHelper.normalizePlatformName(settings.platform);
			var projectData = this.$project.projectData;

			var buildProperties: any = {
				Configuration: settings.configuration,
				Platform: settings.platform,

				AppIdentifier: projectData.AppIdentifier,
				ProjectName: projectData.ProjectName,
				Author: projectData.Author,
				Description: projectData.Description,
				FrameworkVersion: projectData.FrameworkVersion,
				BundleVersion: projectData.BundleVersion,
				DeviceOrientations: projectData.DeviceOrientations,
				BuildForiOSSimulator: settings.buildForiOSSimulator || false
			};
			this.$buildPropertiesAdjustment.adjustBuildProperties(buildProperties);

			if(settings.platform === "Android") {
				buildProperties.AndroidPermissions = projectData.AndroidPermissions;
				buildProperties.AndroidVersionCode = projectData.AndroidVersionCode;
				buildProperties.AndroidHardwareAcceleration = projectData.AndroidHardwareAcceleration;

				var certificateData: ICryptographicIdentity;
				if(options.certificate) {
					certificateData = this.$identityManager.findCertificate(options.certificate).wait();
				} else if(settings.configuration === "Release") {
					certificateData = this.$identityManager.findReleaseCertificate().wait();

					if(!certificateData) {
						this.$logger.warn("Cannot find an applicable Google Play certificate to " +
							"code sign this app. You will not be able to publish this app to " +
							"Google Play. To create a Google Play certificate, run\n" +
							"    $ appbuilder certificate create-self-signed");
					}
				}

				if(certificateData) {
					buildProperties.AndroidCodesigningIdentity = certificateData.Alias;
					this.$logger.info("Using certificate '%s'", certificateData.Alias);
				} else {
					buildProperties.AndroidCodesigningIdentity = "";
				}

				var result = this.beginBuild(buildProperties).wait();
				return result;
			} else if(settings.platform === "iOS") {
				buildProperties.iOSDisplayName = projectData.DisplayName;
				buildProperties.iOSDeviceFamily = projectData.iOSDeviceFamily;
				buildProperties.iOSStatusBarStyle = projectData.iOSStatusBarStyle;
				buildProperties.iOSBackgroundMode = projectData.iOSBackgroundMode;

				var completeAutoselect = (!options.provision && !options.certificate);

				var provisionData: IProvision;
				if(options.provision) {
					provisionData = this.$identityManager.findProvision(options.provision).wait();
				} else if(!settings.buildForiOSSimulator) {
					var deviceIdentifier = settings.device ? settings.device.getIdentifier() : undefined;
					provisionData = this.$identityManager.autoselectProvision(
						projectData.AppIdentifier, settings.provisionTypes, deviceIdentifier).wait();
					options.provision = provisionData.Name;
				}
				this.$logger.info("Using mobile provision '%s'", provisionData ? provisionData.Name : "[No provision]");

				var certificateData: ICryptographicIdentity;
				if(options.certificate) {
					certificateData = this.$identityManager.findCertificate(options.certificate).wait();
				} else if(!settings.buildForiOSSimulator) {
					certificateData = this.$identityManager.autoselectCertificate(provisionData).wait();
					options.certificate = certificateData.Alias;
				}
				this.$logger.info("Using certificate '%s'", certificateData ? certificateData.Alias : "[No certificate]");

				if(!completeAutoselect) {
					var iOSDeploymentValidator = this.$injector.resolve(iOSDeploymentValidatorLib.IOSDeploymentValidator, {
						appIdentifier: projectData.AppIdentifier,
						deviceIdentifier: settings.device ? settings.device.getIdentifier() : null
					});
					iOSDeploymentValidator.throwIfInvalid(
						{ provisionOption: options.provision, certificateOption: options.certificate }).wait();
				}

				if(provisionData) {
					buildProperties.MobileProvisionIdentifier = provisionData.Identifier;
				}
				if(certificateData) {
					buildProperties.iOSCodesigningIdentity = certificateData.Alias;
				}

				var buildResult = this.beginBuild(buildProperties).wait();
				if(provisionData) {
					buildResult.provisionType = provisionData.ProvisionType;
				}
				return buildResult;
			} else if(settings.platform === "WP8") {
				buildProperties.WP8ProductID = projectData.WP8ProductID || MobileHelper.generateWP8GUID();
				buildProperties.WP8PublisherID = projectData.WP8PublisherID;
				buildProperties.WP8Publisher = projectData.WP8Publisher;
				buildProperties.WP8TileTitle = projectData.WP8TileTitle;
				buildProperties.WP8Capabilities = projectData.WP8Capabilities;
				buildProperties.WP8Requirements = projectData.WP8Requirements;
				buildProperties.WP8SupportedResolutions = projectData.WP8SupportedResolutions;

				var buildCompanyHubApp = !settings.downloadFiles;
				if(buildCompanyHubApp) {
					buildProperties.WP8CompanyHubApp = true;
					if(settings.showWp8SigningMessage === undefined) {
						this.$logger.info("The app file will be signed as a Telerik Company Hub app so that it can be" +
							" deployed using a QR code. Use the --download switch if you want to cable deploy" +
							" or publish the built app package.");
					}
				}

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
				if(buildProperties[prop] === undefined) {
					throw new Error(util.format("Build property '%s' is undefined.", prop));
				}

				if(_.isArray(buildProperties[prop])) {
					buildProperties[prop] = buildProperties[prop].join(";");
				}
			});

			var result = this.buildProject(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName,
				this.$staticConfig.SOLUTION_SPACE_NAME, buildProperties).wait();

			if(result.output) {
				var buildLogFilePath = path.join(this.$project.getTempDir().wait(), "build.log");
				this.$fs.writeFile(buildLogFilePath, result.output).wait();
				this.$logger.info("Build log written to '%s'", buildLogFilePath);
			}

			this.$logger.debug(result.buildResults);

			if(result.errors.length) {
				this.$logger.error("Build errors: %s", util.inspect(result.errors));
			}

			return {
				buildProperties: buildProperties,
				packageDefs: result.buildResults
			};
		}).future<Project.IBuildResult>()();
	}

	private showQRCodes(packageDefs: IPackageDownloadViewModel[]): IFuture<void> {
		return (() => {
			if(!packageDefs.length) {
				return;
			}

			var templateFiles = commonHelpers.enumerateFilesInDirectorySync(path.join(__dirname, "../../resources/qr"));
			var targetFiles = _.map(templateFiles, (file) => path.join(this.$project.getTempDir().wait(), path.basename(file)));

			_(_.zip(templateFiles, targetFiles)).each((zipped) => {
				var srcFile = zipped[0];
				var targetFile = zipped[1];
				this.$logger.debug("Copying '%s' to '%s'", srcFile, targetFile);
				this.$fs.copyFile(srcFile, targetFile).wait();
			});

			var scanFile = _.find(targetFiles, (file) => path.basename(file) === "scan.html");
			var htmlTemplateContents = this.$fs.readText(scanFile).wait();
			htmlTemplateContents = htmlTemplateContents.replace(/\$ApplicationName\$/g, this.$project.projectData.ProjectName)
				.replace(/\$Packages\$/g, JSON.stringify(packageDefs));
			this.$fs.writeFile(scanFile, htmlTemplateContents).wait();

			this.$logger.debug("Updated scan.html");
			this.$opener.open(scanFile);
		}).future<void>()();
	}

	public build(settings: Project.IBuildSettings): IFuture<Server.IPackageDef[]> {
		return ((): Server.IPackageDef[]=> {
			this.$project.ensureProject();

			settings.configuration = settings.configuration || "Debug";
			this.$logger.info("Building project for platform '%s', configuration '%s'", settings.platform, settings.configuration);

			this.$platformMigrator.ensureAllPlatformAssets().wait();
			this.importProject().wait();

			var buildResult = this.requestCloudBuild(settings).wait();
			var packageDefs = buildResult.packageDefs;

			if(buildResult.provisionType === constants.ProvisionType.Development && !settings.downloadFiles) {
				this.$logger.info("Package built with 'Development' provision type. Downloading package, instead of generating QR code.");
				this.$logger.info("Deploy manually to your device using iTunes.");
				settings.showQrCodes = false;
				settings.downloadFiles = true;
			}

			if(!packageDefs.length) {
				this.$errors.fail("Build failed. For more information read the build log.");
			}

			if(settings.showQrCodes) {
				var urlKind = buildResult.provisionType === constants.ProvisionType.AdHoc ? "manifest" : "package";
				var liveSyncToken = buildResult.buildProperties.LiveSyncToken;

				var packageDownloadViewModels = _.map(packageDefs, (def: Server.IPackageDef): IPackageDownloadViewModel => {
					var liveSyncUrl = this.getLiveSyncUrl(urlKind, def.relativePath, liveSyncToken).wait();

					var packageUrl = (urlKind !== "package")
						? this.getLiveSyncUrl("package", def.relativePath, liveSyncToken).wait()
						: liveSyncUrl;
					this.$logger.debug("Download URL is '%s'", packageUrl);

					return {
						qrUrl: liveSyncUrl,
						qrImageData: this.$qr.generateDataUri(liveSyncUrl),
						packageUrls: [{
							packageUrl: packageUrl,
							downloadText: "Download"
						}],
						instruction: util.format("Scan the QR code below to install %s to %s", def.solution, def.platform),
					};
				});

				if(settings.platform === "WP8") {
					var aetUrl = util.format("%s://%s/%s", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER, BuildService.WinPhoneAetPath);
					var aetDef: IPackageDownloadViewModel = {
						qrUrl: aetUrl,
						qrImageData: this.$qr.generateDataUri(aetUrl),
						packageUrls: [{ packageUrl: aetUrl, downloadText: "Download application enrollment token" }],
						instruction: util.format("Scan the QR code below to install the Telerik Company Hub App application enrollment token (AET)")
					};
					packageDownloadViewModels.push(aetDef);
				}

				this.showQRCodes(packageDownloadViewModels).wait();
			}

			if(settings.downloadFiles) {
				packageDefs.forEach((pkg: Server.IPackageDef) => {
					var targetFileName = settings.downloadedFilePath
						|| path.join(this.$project.getProjectDir().wait(), path.basename(pkg.solutionPath));

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
			var result = this.build({
				platform: platform,
				configuration: this.getBuildConfiguration(),
				downloadFiles: true,
				downloadedFilePath: options["save-to"],
				provisionTypes: [constants.ProvisionType.AdHoc, constants.ProvisionType.Development],
				device: device
			}).wait();
			return result;
		}).future<Server.IPackageDef[]>()();
	}

	public executeBuild(platform: string): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			if(!this.$project.capabilities.build && !options.companion) {
				this.$errors.fail("Use $ appbuilder build <Platform> --companion to deploy your application to Telerik Nativescript Companion App. You will be able to build %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			this.executeBuildCordova(platform).wait();
		}).future<void>()();
	}

	private executeBuildCordova(platform: string): IFuture<void> {
		return (() => {
			platform = MobileHelper.validatePlatformName(platform, this.$errors);

			if(options["save-to"]) {
				options.download = true;
			}

			if(options.download && options.companion) {
				this.$errors.fail("Cannot specify both --download (or --save-to) and --companion options.");
			}

			this.$loginManager.ensureLoggedIn().wait();

			if(options.companion) {
				this.deployToIon(platform).wait();
			} else {
				if(!MobileHelper.platformCapabilities[platform].wirelessDeploy && !options.download) {
					this.$logger.info("Wireless deploying is not supported for platform %s. The package will be downloaded after build.", platform);
					options.download = true;
				}

				var willDownload = options.download;
				var provisionTypes = [constants.ProvisionType.AdHoc];
				if(willDownload) {
					provisionTypes.push(constants.ProvisionType.Development);
				}

				this.build({
					platform: platform,
					configuration: this.getBuildConfiguration(),
					showQrCodes: !options.download,
					downloadFiles: options.download,
					downloadedFilePath: options["save-to"],
					provisionTypes: provisionTypes
				}).wait();
			}
		}).future<void>()();
	}

	private deployToIon(platform: string): IFuture<void> {
		return (() => {
			platform = MobileHelper.validatePlatformName(platform, this.$errors);
			if(!MobileHelper.platformCapabilities[platform].companion) {
				this.$errors.fail("The companion app is not available on %s.", platform);
			}

			this.$logger.info("Deploying to AppBuilder companion app.");

			this.importProject().wait();

			var appIdentifier = AppIdentifier.createAppIdentifier(platform,
				this.$project.projectData.AppIdentifier, true, this.$project.projectType);

			var liveSyncToken = this.$server.cordova.getLiveSyncToken(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName).wait();

			var hostPart = util.format("%s://%s/appbuilder", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
			var fullDownloadPath = util.format(appIdentifier.liveSyncFormat, appIdentifier.encodeLiveSyncHostUri(hostPart), querystring.escape(liveSyncToken));

			this.$logger.debug("Using LiveSync URL for Ion: %s", fullDownloadPath);

			this.showQRCodes([{
				instruction: util.format("Scan the QR code below to install %s to AppBuilder companion app for %s", this.$project.projectData.ProjectName, platform),
				qrImageData: this.$qr.generateDataUri(fullDownloadPath)
			}]).wait();
		}).future<void>()();
	}

	public importProject(): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			this.$loginManager.ensureLoggedIn().wait();

			var projectZipFile = this.zipProject().wait();
			this.$logger.debug("zipping completed, result file size: %d", this.$fs.getFileSize(projectZipFile).wait().toString());

			this.$server.projects.importProject(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName,
				this.$fs.createReadStream(projectZipFile)).wait();
			this.$logger.trace("Project imported");
		}).future<void>()();
	}
}
$injector.register("buildService", BuildService);

class PlatformCommandParameter implements ICommandParameter {
	constructor(private $project: Project.IProject,
		private $errors: IErrors) { }
	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(!validationValue) {
				return false;
			}

			this.$project.ensureProject();

			if(!this.$project.capabilities.build && !options.companion) {
				this.$errors.fail("Use $ appbuilder build <Platform> --companion to deploy your application to Telerik Nativescript Companion App. You will be able to build %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			MobileHelper.validatePlatformName(validationValue, this.$errors);

			return true;
		}).future<boolean>()();
	}
}

export class BuildCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService, private $project: Project.IProject,
		private $errors: IErrors,
		private $logger: ILogger) { }
	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$buildService.executeBuild(args[0]).wait();
		}).future<void>()();
	}
	allowedParameters: ICommandParameter[] = [new PlatformCommandParameter(this.$project, this.$errors)];
}
$injector.registerCommand("build", BuildCommand);

export class ImportProjectCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$buildService.importProject().wait();
		}).future<void>()();
	}


}
$injector.registerCommand("livesync|cloud", ImportProjectCommand);
$injector.registerCommand("live-sync|cloud", ImportProjectCommand);
