import * as util from "util";
import * as querystring from "querystring";
import * as path from "path";
import {EOL} from "os";
import * as plist from "plist";
import * as iOSDeploymentValidatorLib from "../validators/ios-deployment-validator";
import * as constants from "../common/constants";
import minimatch = require("minimatch");

export class BuildService implements Project.IBuildService {
	private static WinPhoneAetPath = "appbuilder/install/WinPhoneAet";
	private static APPIDENTIFIER_PLACE_HOLDER = "$AppIdentifier$";

	constructor(private $config: IConfiguration,
		private $staticConfig: IStaticConfig,
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
		private $platformMigrator: Project.IPlatformMigrator,
		private $jsonSchemaValidator: IJsonSchemaValidator,
		private $mobileHelper: Mobile.IMobileHelper,
		private $progressIndicator: IProgressIndicator,
		private $options: IOptions,
		private $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectConstants: Project.IConstants) { }

	public getLiveSyncUrl(urlKind: string, filesystemPath: string, liveSyncToken: string): IFuture<string> {
		return ((): string => {
			urlKind = urlKind.toLowerCase();
			if (urlKind !== "manifest" && urlKind !== "package") {
				throw new Error("urlKind must be either 'manifest' or 'package'");
			}

			// escape URLs twice to work around a bug in bit.ly
			let fullDownloadPath = util.format("%s://%s/appbuilder/Mist/MobilePackage/%s?packagePath=%s&token=%s",
				this.$config.AB_SERVER_PROTO,
				this.$config.AB_SERVER, urlKind,
				querystring.escape(querystring.escape(filesystemPath)),
				querystring.escape(querystring.escape(liveSyncToken)));
			this.$logger.debug("Minifying LiveSync URL '%s'", fullDownloadPath);

			let url = this.$server.cordova.getLiveSyncUrl(fullDownloadPath).wait();
			if (urlKind === "manifest") {
				url = "itms-services://?action=download-manifest&amp;url=" + querystring.escape(url);
			}

			this.$logger.debug("Device install URL '%s'", url);

			return url;
		}).future<string>()();
	}

	private buildProject(solutionName: string, projectName: string, solutionSpace: string, buildProperties: any): IFuture<Server.IBuildResult> {
		return ((): Server.IBuildResult => {
			this.$logger.info("Building project %s/%s (%s)", solutionName, projectName, solutionSpace);
			this.$logger.printInfoMessageOnSameLine("Building...");

			this.$server.projects.setProjectProperty(solutionName, projectName, buildProperties.Configuration, { AppIdentifier: buildProperties.AppIdentifier }).wait();

			let liveSyncToken = this.$server.cordova.getLiveSyncToken(solutionName, projectName).wait();
			buildProperties.LiveSyncToken = liveSyncToken;

			let buildProjectFuture = this.$server.build.buildProject(solutionName, projectName, { Properties: buildProperties, Targets: [] });
			this.$progressIndicator.showProgressIndicator(buildProjectFuture, 2000).wait();

			let body = buildProjectFuture.get();
			let buildResults: Server.IPackageDef[] = body.ResultsByTarget["Build"].Items.map((buildResult: any) => {
				let fullPath = buildResult.FullPath.replace(/\\/g, "/");
				let solutionPath = util.format("%s/%s", projectName, fullPath);

				return {
					platform: buildResult.Platform,
					solution: solutionName,
					solutionPath: solutionPath,
					relativePath: buildResult.FullPath,
					disposition: buildResult.Disposition,
					format: buildResult.Format,
					key: buildResult.Key,
					value: buildResult.Value,
					architecture: buildResult.Architecture
				};
			});

			return {
				buildResults: buildResults,
				output: body.Output,
				errors: body.Errors.map(error => error.Message)
			};
		}).future<Server.IBuildResult>()();
	}

	private requestCloudBuild(settings: Project.IBuildSettings): IFuture<Project.IBuildResult> {
		return ((): Project.IBuildResult => {
			settings.platform = this.$mobileHelper.normalizePlatformName(settings.platform);
			let projectData = this.$project.projectInformation.configurationSpecificData[settings.projectConfiguration.toLowerCase()] || this.$project.projectData;

			let buildProperties: any = {
				ProjectConfiguration: settings.projectConfiguration,
				BuildConfiguration: settings.buildConfiguration,
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

			this.$project.adjustBuildProperties(buildProperties);

			if (settings.platform === "Android") {
				buildProperties.AndroidPermissions = projectData.AndroidPermissions;
				buildProperties.AndroidVersionCode = projectData.AndroidVersionCode;
				buildProperties.AndroidHardwareAcceleration = projectData.AndroidHardwareAcceleration;

				let certificateData: ICryptographicIdentity;
				if (this.$options.certificate) {
					certificateData = this.$identityManager.findCertificate(this.$options.certificate).wait();
				} else if (settings.buildForTAM) {
					this.$logger.warn("You have not specified certificate to code sign this app. We'll use default debug certificate. " +
						"Use --certificate option to specify your own certificate. You can check available certificates with '$ appbuilder certificate' command.");
				} else if (settings.buildConfiguration === constants.Configurations.Release ) {
					certificateData = this.$identityManager.findReleaseCertificate().wait();

					if (!certificateData) {
						this.$logger.warn("Cannot find an applicable Google Play certificate to " +
							"code sign this app. You will not be able to publish this app to " +
							"Google Play. To create a Google Play certificate, run\n" +
							"    $ appbuilder certificate create-self-signed");
					}
				}

				if (certificateData) {
					if (certificateData.isiOS) {
						this.$errors.failWithoutHelp("The certificate you have chosen is ineligible for the Android platform.");
					}

					buildProperties.AndroidCodesigningIdentity = certificateData.Alias;
					this.$logger.info("Using certificate '%s'", certificateData.Alias);
				} else {
					buildProperties.AndroidCodesigningIdentity = "";
				}

				let result = this.beginBuild(buildProperties).wait();
				return result;
			} else if (settings.platform === "iOS") {
				let appIdentifier = projectData.AppIdentifier;

				let configFileContent = this.$project.getConfigFileContent("ios-info").wait();
				if (configFileContent) {
					let parsed = plist.parse(configFileContent);
					let cfBundleIdentifier = (<any>parsed).CFBundleIdentifier;
					if (cfBundleIdentifier && cfBundleIdentifier !== BuildService.APPIDENTIFIER_PLACE_HOLDER) {
						appIdentifier = cfBundleIdentifier;
					}
				}

				buildProperties.iOSDisplayName = projectData.DisplayName;
				buildProperties.iOSDeviceFamily = projectData.iOSDeviceFamily;
				buildProperties.iOSStatusBarStyle = projectData.iOSStatusBarStyle;
				buildProperties.iOSBackgroundMode = projectData.iOSBackgroundMode;

				let completeAutoselect = (!this.$options.provision && !this.$options.certificate);

				let provisionData: IProvision;
				if (this.$options.provision) {
					provisionData = this.$identityManager.findProvision(this.$options.provision).wait();
					if (settings.buildForTAM && provisionData.ProvisionType === constants.ProvisionType.AppStore) {
						this.$errors.failWithoutHelp("You cannot use AppStore provision for upload in AppManager. Please use Development, AdHoc or Enterprise provision." +
							"You can check availalbe provisioning profiles by using '$ appbuilder provision' command.");
					}
				} else if (!settings.buildForiOSSimulator) {
					let deviceIdentifier = settings.device ? settings.device.deviceInfo.identifier : undefined;
					try {
						provisionData = this.$identityManager.autoselectProvision(appIdentifier, settings.provisionTypes || [constants.ProvisionType.AdHoc], deviceIdentifier).wait();
					} catch (error) {
						if (!this.$options.download) {
							this.$logger.warn("Cannot generate QR code because an applicable AdHoc provisioning profile is not available.");
							let additionalInfo = error.message.split(EOL)[1];
							if (additionalInfo) {
								this.$logger.warn(additionalInfo);
							}
							this.$logger.warn("Attempting to use Development provisioning profile instead.");
						}

						provisionData = this.$identityManager.autoselectProvision(appIdentifier, [constants.ProvisionType.Development], deviceIdentifier).wait();
					}
					this.$options.provision = provisionData.Name;
				}
				this.$logger.info("Using mobile provision '%s'", provisionData ? provisionData.Name : "[No provision]");

				let certificateData: ICryptographicIdentity;
				if (this.$options.certificate) {
					certificateData = this.$identityManager.findCertificate(this.$options.certificate).wait();
				} else if (!settings.buildForiOSSimulator) {
					certificateData = this.$identityManager.autoselectCertificate(provisionData).wait();
					this.$options.certificate = certificateData.Alias;
				}
				this.$logger.info("Using certificate '%s'", certificateData ? certificateData.Alias : "[No certificate]");

				if (!completeAutoselect) {
					let iOSDeploymentValidator = this.$injector.resolve(iOSDeploymentValidatorLib.IOSDeploymentValidator, {
						appIdentifier: appIdentifier,
						deviceIdentifier: settings.device ? settings.device.deviceInfo.identifier : null
					});
					iOSDeploymentValidator.throwIfInvalid(
						{ provisionOption: this.$options.provision, certificateOption: this.$options.certificate }).wait();
				}

				if (provisionData) {
					buildProperties.MobileProvisionIdentifier = provisionData.Identifier;
				}
				if (certificateData) {
					buildProperties.iOSCodesigningIdentity = certificateData.Alias;
				}

				let buildResult = this.beginBuild(buildProperties).wait();
				if (provisionData) {
					buildResult.provisionType = provisionData.ProvisionType;
				}
				return buildResult;
			} else if (settings.platform === "WP8") {
				let buildCompanyHubApp = !settings.downloadFiles;
				if (this.$project.projectData.WPSdk === "8.1" && ((this.$options.release && settings.downloadFiles) || settings.buildForTAM)) {
					this.$logger.warn("Verify that you have configured your project for publishing in the Windows Phone Store. For more information see: %s",
						settings.buildForTAM ? "http://docs.telerik.com/platform/appbuilder/publishing-your-app/publish-appmanager#prerequisites" :
							"http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-wp8#prerequisites");
				}

				if (buildCompanyHubApp) {
					buildProperties.WP8CompanyHubApp = true;
					if (settings.showWp8SigningMessage === undefined) {
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
				if (buildProperties[prop] === undefined) {
					this.$logger.warn(`Build property '${prop}' is undefined. The property is optional, but you can set it by running '${this.$staticConfig.CLIENT_NAME.toLowerCase()} prop set ${prop} <value>'.`);
				}

				if (_.isArray(buildProperties[prop])) {
					buildProperties[prop] = buildProperties[prop].join(";");
				}
			});

			let result = this.buildProject(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName, this.$staticConfig.SOLUTION_SPACE_NAME, buildProperties).wait();

			if (result.output) {
				let buildLogFilePath = path.join(this.$project.getTempDir().wait(), "build.log");
				this.$fs.writeFile(buildLogFilePath, result.output).wait();
				this.$logger.info("Build log written to '%s'", buildLogFilePath);
			}

			this.$logger.debug(result.buildResults);

			if (result.errors.length) {
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
			if (!packageDefs.length) {
				return;
			}

			let templateFiles = this.$fs.enumerateFilesInDirectorySync(path.join(__dirname, "../../resources/qr"));
			let targetFiles = _.map(templateFiles, (file) => path.join(this.$project.getTempDir().wait(), path.basename(file)));

			_(_.zip(templateFiles, targetFiles)).each(zipped => {
				let srcFile = zipped[0];
				let targetFile = zipped[1];
				this.$logger.debug("Copying '%s' to '%s'", srcFile, targetFile);
				this.$fs.copyFile(srcFile, targetFile).wait();
			});

			let scanFile = _.find(targetFiles, (file) => path.basename(file) === "scan.html");
			let htmlTemplateContents = this.$fs.readText(scanFile).wait();
			htmlTemplateContents = htmlTemplateContents.replace(/\$ApplicationName\$/g, this.$project.projectData.ProjectName)
				.replace(/\$Packages\$/g, JSON.stringify(packageDefs));
			this.$fs.writeFile(scanFile, htmlTemplateContents).wait();

			this.$logger.debug("Updated scan.html");
			this.$opener.open(scanFile);
		}).future<void>()();
	}

	public build(settings: Project.IBuildSettings): IFuture<Server.IPackageDef[]> {
		return ((): Server.IPackageDef[] => {
			this.$project.ensureProject();

			this.$jsonSchemaValidator.validate(this.$project.projectData);
			this.$jsonSchemaValidator.validateWithBuildSchema(this.$project.projectData, settings.platform);

			settings.projectConfiguration = settings.projectConfiguration || this.$project.getProjectConfiguration();
			settings.buildConfiguration = settings.buildConfiguration || this.$project.getBuildConfiguration();

			this.$logger.info("Building project for platform '%s', project configuration '%s', build configuration '%s'",
				settings.platform, settings.projectConfiguration, settings.buildConfiguration);

			this.$platformMigrator.ensureAllPlatformAssets().wait();
			this.$project.importProject().wait();

			let buildResult = this.requestCloudBuild(settings).wait();
			let packageDefs = buildResult.packageDefs;

			if ((buildResult.provisionType === constants.ProvisionType.Development || buildResult.provisionType === constants.ProvisionType.AppStore) && !settings.downloadFiles && !settings.buildForTAM) {
				this.$logger.info("Package built with '%s' provision type. Downloading package, instead of generating QR code.", buildResult.provisionType);
				this.$logger.info("Deploy manually to your device using iTunes.");
				settings.showQrCodes = false;
				settings.downloadFiles = true;
			}

			if (!packageDefs.length) {
				this.$errors.fail("Build failed. For more information read the build log.");
			}

			if (settings.showQrCodes) {
				let urlKind = buildResult.provisionType === constants.ProvisionType.AdHoc ? "manifest" : "package";
				let liveSyncToken = buildResult.buildProperties.LiveSyncToken;
				let appPackages = _.filter(packageDefs, (def: Server.IPackageDef) => !def.disposition || def.disposition === "BuildResult");

				let packageDownloadViewModels = _.map(appPackages, (def: Server.IPackageDef): IPackageDownloadViewModel => {
					let liveSyncUrl = this.getLiveSyncUrl(urlKind, def.relativePath, liveSyncToken).wait();

					let packageUrl = (urlKind !== "package")
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

				if (settings.platform === "WP8") {
					let aetUrl = util.format("%s://%s/%s", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER, BuildService.WinPhoneAetPath);
					let aetDef: IPackageDownloadViewModel = {
						qrUrl: aetUrl,
						qrImageData: this.$qr.generateDataUri(aetUrl),
						packageUrls: [{ packageUrl: aetUrl, downloadText: "Download application enrollment token" }],
						instruction: util.format("Scan the QR code below to install the Telerik Company Hub App application enrollment token (AET)")
					};
					packageDownloadViewModels.push(aetDef);
				}

				this.showQRCodes(packageDownloadViewModels).wait();
			}

			if (settings.downloadFiles) {
				packageDefs.forEach((pkg: Server.IPackageDef) => {
					let targetFileName: string;
					if (pkg.disposition === this.$projectConstants.ADDITIONAL_FILE_DISPOSITION) {
						targetFileName = path.join(this.$project.getProjectDir().wait(), this.$projectConstants.ADDITIONAL_FILES_DIRECTORY, path.basename(pkg.solutionPath));
					} else {
						targetFileName = settings.downloadedFilePath
							|| path.join(this.$project.getProjectDir().wait(), path.basename(pkg.solutionPath));
					}

					this.$logger.info("Downloading file '%s/%s' into '%s'", pkg.solution, pkg.solutionPath, targetFileName);
					let targetFile = this.$fs.createWriteStream(targetFileName);
					this.$server.filesystem.getContent(pkg.solution, pkg.solutionPath, targetFile).wait();
					this.$logger.info("Download completed: %s", targetFileName);
					pkg.localFile = targetFileName;
				});
			}

			return packageDefs;
		}).future<Server.IPackageDef[]>()();
	}

	public buildForDeploy(platform: string, downloadedFilePath: string, buildForiOSSimulator?: boolean, device?: Mobile.IDevice): IFuture<IApplicationInformation> {
		return ((): IApplicationInformation => {
			platform = this.$mobileHelper.validatePlatformName(platform);
			this.$project.ensureProject();
			let buildResult = this.build({
				platform: platform,
				downloadFiles: true,
				downloadedFilePath: downloadedFilePath,
				buildForiOSSimulator: buildForiOSSimulator,
				device: device
			}).wait();

			let packageName = _.filter(buildResult, (def: Server.IPackageDef) => !def.disposition || def.disposition === "BuildResult")[0].localFile;
			let metadata = _.filter(buildResult, (def: Server.IPackageDef) => !def.disposition || (def.disposition === "BuildResultMetadata" && def.key === "AppIdentifier"))[0];
			let appIdentifier = metadata ? metadata.value : this.$project.projectData.AppIdentifier;
			return {
				packageName,
				appIdentifier
			};
		}).future<IApplicationInformation>()();
	}

	public buildForiOSSimulator(downloadedFilePath: string, device?: Mobile.IDevice): IFuture<string> {
		return (() => {
			let packageFile = this.buildForDeploy(this.$devicePlatformsConstants.iOS, downloadedFilePath, true, device).wait().packageName;
			let tempDir = this.$project.getTempDir("emulatorFiles").wait();
			this.$fs.unzip(packageFile, tempDir).wait();
			let appFilePath = path.join(tempDir, this.$fs.readDirectory(tempDir).wait().filter(minimatch.filter("*.app"))[0]);
			return appFilePath;
		}).future<string>()();
	}

	public executeBuild(platform: string, opts?: { buildForiOSSimulator?: boolean }): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			if (!this.$project.capabilities.build) {
				this.$errors.failWithoutHelp("This command is not applicable to %s projects ", this.$project.projectData.Framework);
			}

			this.executeBuildCore(platform, opts).wait();
		}).future<void>()();
	}

	private executeBuildCore(platform: string, opts?: { buildForiOSSimulator?: boolean }): IFuture<void> {
		return (() => {
			platform = this.$mobileHelper.validatePlatformName(platform);

			if (this.$options.saveTo) {
				this.$options.download = true;
			}

			if (this.$options.download && this.$options.companion) {
				this.$errors.fail("Cannot specify both --download (or --save-to) and --companion options.");
			}

			this.$loginManager.ensureLoggedIn().wait();

			this.$project.checkSdkVersions(platform);

			if (this.$options.companion) {
				this.deployToIon(platform).wait();
			} else {
				if (!this.$mobileHelper.getPlatformCapabilities(platform).wirelessDeploy && !this.$options.download) {
					this.$logger.info("Wireless deploying is not supported for platform %s. The package will be downloaded after build.", platform);
					this.$options.download = true;
				}

				this.build({
					platform: platform,
					showQrCodes: !this.$options.download,
					downloadFiles: this.$options.download,
					downloadedFilePath: this.$options.saveTo,
					buildForiOSSimulator: opts && opts.buildForiOSSimulator
				}).wait();
			}
		}).future<void>()();
	}

	private deployToIon(platform: string): IFuture<void> {
		return (() => {
			platform = this.$mobileHelper.validatePlatformName(platform);
			if (!this.$mobileHelper.getPlatformCapabilities(platform).companion) {
				this.$errors.fail("The companion app is not available on %s.", platform);
			}

			this.$logger.info("Deploying to AppBuilder companion app.");

			this.$project.importProject().wait();

			let appIdentifier = this.$deviceAppDataFactory.create<ILiveSyncDeviceAppData>(this.$project.projectData.AppIdentifier, platform, null);
			let liveSyncToken = this.$server.cordova.getLiveSyncToken(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName).wait();

			let hostPart = util.format("%s://%s/appbuilder", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
			let fullDownloadPath = util.format(appIdentifier.liveSyncFormat,
												appIdentifier.encodeLiveSyncHostUri(hostPart),
												querystring.escape(liveSyncToken),
												querystring.escape(this.$project.projectData.ProjectName),
												this.$project.getProjectConfiguration());

			this.$logger.debug("Using LiveSync URL for Ion: %s", fullDownloadPath);

			this.showQRCodes([{
				instruction: util.format("Scan the QR code below to load %s in the AppBuilder companion app for %s", this.$project.projectData.ProjectName, platform),
				qrImageData: this.$qr.generateDataUri(fullDownloadPath)
			}]).wait();
		}).future<void>()();
	}
}
$injector.register("buildService", BuildService);
