import * as util from "util";
import * as querystring from "querystring";
import * as path from "path";
import { EOL } from "os";
import * as plist from "plist";
import * as iOSDeploymentValidatorLib from "../validators/ios-deployment-validator";
import * as constants from "../common/constants";
import minimatch = require("minimatch");

export class BuildService implements Project.IBuildService {
	private static WinPhoneAetPath = "appbuilder/install/WinPhoneAet";
	private static APPIDENTIFIER_PLACE_HOLDER = "$AppIdentifier$";
	private static ACCEPT_RESULT_URL = "Url";
	private static ACCEPT_RESULT_LOCAL_PATH = "LocalPath";

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
		private $projectMigrationService: Project.IProjectMigrationService,
		private $jsonSchemaValidator: IJsonSchemaValidator,
		private $mobileHelper: Mobile.IMobileHelper,
		private $progressIndicator: IProgressIndicator,
		private $options: IOptions,
		private $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectConstants: Project.IConstants,
		private $httpClient: Server.IHttpClient) { }

	public async getDownloadUrl(urlKind: string, liveSyncToken: string, packageDef: Server.IPackageDef, projectConfiguration: string): Promise<string> {
			urlKind = urlKind.toLowerCase();
			if (urlKind !== "manifest" && urlKind !== "package") {
				throw new Error("urlKind must be either 'manifest' or 'package'");
			}

			let fullDownloadPath: string;
			if (packageDef.format === BuildService.ACCEPT_RESULT_URL && urlKind === "package") {
				fullDownloadPath = packageDef.url;
			} else {
				// escape URLs twice to work around a bug in bit.ly
				fullDownloadPath = util.format("%s://%s/appbuilder/Mist/MobilePackage/%s?packagePath=%s&token=%s&projectConfiguration=%s",
					this.$config.AB_SERVER_PROTO,
					this.$config.AB_SERVER, urlKind,
					querystring.escape(querystring.escape(packageDef.relativePath)),
					querystring.escape(querystring.escape(liveSyncToken)),
					projectConfiguration);
			}

			this.$logger.debug("Minifying LiveSync URL '%s'", fullDownloadPath);

			let url = await  this.$server.cordova.getLiveSyncUrl(fullDownloadPath);
			if (urlKind === "manifest") {
				url = "itms-services://?action=download-manifest&amp;url=" + querystring.escape(url);
			}

			this.$logger.debug("Device install URL '%s'", url);

			return url;
	}

	private async buildProject(solutionName: string, projectName: string, solutionSpace: string, buildProperties: any): Promise<Server.IBuildResult> {
			this.$logger.info("Building project %s/%s (%s)", solutionName, projectName, solutionSpace);
			this.$logger.printInfoMessageOnSameLine("Building...");

			await this.$server.projects.setProjectProperty(solutionName, projectName, buildProperties.Configuration, { AppIdentifier: buildProperties.AppIdentifier });

			let liveSyncToken = await  this.$server.cordova.getLiveSyncToken(solutionName, projectName);
			buildProperties.LiveSyncToken = liveSyncToken;

			let buildProjectFuture = this.$server.build.buildProject(solutionName, projectName, { Properties: buildProperties, Targets: [] });
			await this.$progressIndicator.showProgressIndicator(buildProjectFuture, 2000);

			let body = buildProjectFuture.get();
			let buildResults: Server.IPackageDef[] = body.ResultsByTarget["Build"].Items.map((buildResult: any) => {
				let fullPath = buildResult.FullPath.replace(/\\/g, "/");
				let solutionPath = util.format("%s/%s", projectName, fullPath);

				let fileExtension: string = buildResult.Extension;

				// Since the server can return in the Extension property string which is the file extension followed by query string we need to remove the query string.
				let indexOfQueryString = fileExtension.indexOf("?");
				if (indexOfQueryString >= 0) {
					fileExtension = fileExtension.substring(0, indexOfQueryString);
				}

				let fullFileName = `${buildResult.Filename}${fileExtension}`;
				return {
					platform: buildResult.Platform,
					solution: solutionName,
					solutionPath: solutionPath,
					relativePath: buildResult.FullPath,
					disposition: buildResult.Disposition,
					format: buildResult.Format,
					url: buildResult.FullPath,
					fileName: fullFileName,
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
	}

	private async requestCloudBuild(settings: Project.IBuildSettings): Promise<Project.IBuildResult> {
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
				BuildForiOSSimulator: settings.buildForiOSSimulator || false,
				AcceptResults: `${BuildService.ACCEPT_RESULT_URL};${BuildService.ACCEPT_RESULT_LOCAL_PATH}`
			};

			this.$project.adjustBuildProperties(buildProperties);

			if (settings.platform === "Android") {
				buildProperties.AndroidPermissions = projectData.AndroidPermissions;
				buildProperties.AndroidVersionCode = projectData.AndroidVersionCode;
				buildProperties.AndroidHardwareAcceleration = projectData.AndroidHardwareAcceleration;

				let certificateData: ICryptographicIdentity;
				if (this.$options.certificate) {
					certificateData = await  this.$identityManager.findCertificate(this.$options.certificate);
				} else if (settings.buildForTAM) {
					this.$logger.warn("You have not specified certificate to code sign this app. We'll use default debug certificate. " +
						"Use --certificate option to specify your own certificate. You can check available certificates with '$ appbuilder certificate' command.");
				} else if (settings.buildConfiguration === constants.Configurations.Release) {
					certificateData = await  this.$identityManager.findReleaseCertificate();

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

				let result = await  this.beginBuild(buildProperties);
				return result;
			} else if (settings.platform === "iOS") {
				let appIdentifier = projectData.AppIdentifier;

				let configFileContent = this.$project.getConfigFileContent("ios-info");
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
					provisionData = await  this.$identityManager.findProvision(this.$options.provision);
					if (settings.buildForTAM && provisionData.ProvisionType === constants.ProvisionType.AppStore) {
						this.$errors.failWithoutHelp("You cannot use AppStore provision for upload in AppManager. Please use Development, AdHoc or Enterprise provision." +
							"You can check availalbe provisioning profiles by using '$ appbuilder provision' command.");
					}
				} else if (!settings.buildForiOSSimulator) {
					let deviceIdentifier = settings.device ? settings.device.deviceInfo.identifier : undefined;
					try {
						provisionData = await  this.$identityManager.autoselectProvision(appIdentifier, settings.provisionTypes || [constants.ProvisionType.AdHoc], deviceIdentifier);
					} catch (error) {
						if (!this.$options.download) {
							this.$logger.warn("Cannot generate QR code because an applicable AdHoc provisioning profile is not available.");
							let additionalInfo = error.message.split(EOL)[1];
							if (additionalInfo) {
								this.$logger.warn(additionalInfo);
							}
							this.$logger.warn("Attempting to use Development provisioning profile instead.");
						}

						provisionData = await  this.$identityManager.autoselectProvision(appIdentifier, [constants.ProvisionType.Development], deviceIdentifier);
					}
					this.$options.provision = provisionData.Name;
				}
				this.$logger.info("Using mobile provision '%s'", provisionData ? provisionData.Name : "[No provision]");

				let certificateData: ICryptographicIdentity;
				if (this.$options.certificate) {
					certificateData = await  this.$identityManager.findCertificate(this.$options.certificate);
				} else if (!settings.buildForiOSSimulator) {
					certificateData = await  this.$identityManager.autoselectCertificate(provisionData);
					this.$options.certificate = certificateData.Alias;
				}
				this.$logger.info("Using certificate '%s'", certificateData ? certificateData.Alias : "[No certificate]");

				if (!completeAutoselect) {
					let iOSDeploymentValidator = this.$injector.resolve(iOSDeploymentValidatorLib.IOSDeploymentValidator, {
						appIdentifier: appIdentifier,
						deviceIdentifier: settings.device ? settings.device.deviceInfo.identifier : null
					});
					iOSDeploymentValidator.throwIfInvalid(
						await { provisionOption: this.$options.provision, certificateOption: this.$options.certificate });
				}

				if (provisionData) {
					buildProperties.MobileProvisionIdentifier = provisionData.Identifier;
				}
				if (certificateData) {
					buildProperties.iOSCodesigningIdentity = certificateData.Alias;
				}

				let buildResult = await  this.beginBuild(buildProperties);
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

				await return this.beginBuild(buildProperties);
			} else {
				this.$logger.fatal("Unknown platform '%s'.", settings.platform);
				return null;
			}
	}

	private async beginBuild(buildProperties: any): Promise<Project.IBuildResult> {
			Object.keys(buildProperties).forEach((prop) => {
				if (buildProperties[prop] === undefined) {
					this.$logger.warn(`Build property '${prop}' is undefined. The property is optional, but you can set it by running '${this.$staticConfig.CLIENT_NAME.toLowerCase()} prop set ${prop} <value>'.`);
				}

				if (_.isArray(buildProperties[prop])) {
					buildProperties[prop] = buildProperties[prop].join(";");
				}
			});

			let result = await  this.buildProject(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName, this.$staticConfig.SOLUTION_SPACE_NAME, buildProperties);

			if (result.output) {
				let buildLogFilePath = path.join(this.$project.getTempDir(), "build.log");
				this.$fs.writeFile(buildLogFilePath, result.output);
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
	}

	private showQRCodes(packageDefs: IPackageDownloadViewModel[]): void {
		if (!packageDefs.length) {
			return;
		}

		let templateFiles = this.$fs.enumerateFilesInDirectorySync(path.join(__dirname, "../../resources/qr"));
		let targetFiles = _.map(templateFiles, (file) => path.join(this.$project.getTempDir(), path.basename(file)));

		_(_.zip(templateFiles, targetFiles)).each(zipped => {
			let srcFile = zipped[0];
			let targetFile = zipped[1];
			this.$logger.debug("Copying '%s' to '%s'", srcFile, targetFile);
			this.$fs.copyFile(srcFile, targetFile);
		});

		let scanFile = _.find(targetFiles, (file) => path.basename(file) === "scan.html");
		let htmlTemplateContents = this.$fs.readText(scanFile);
		htmlTemplateContents = htmlTemplateContents.replace(/\$ApplicationName\$/g, this.$project.projectData.ProjectName)
			.replace(/\$Packages\$/g, JSON.stringify(packageDefs));
		this.$fs.writeFile(scanFile, htmlTemplateContents);

		this.$logger.debug("Updated scan.html");
		this.$opener.open(scanFile);
	}

	public async build(settings: Project.IBuildSettings): Promise<Server.IPackageDef[]> {
			this.$project.ensureProject();

			this.$jsonSchemaValidator.validate(this.$project.projectData);
			this.$jsonSchemaValidator.validateWithBuildSchema(this.$project.projectData, settings.platform);
			await this.$project.validateAppIdentifier(settings.platform);

			settings.projectConfiguration = settings.projectConfiguration || this.$project.getProjectConfiguration();
			settings.buildConfiguration = settings.buildConfiguration || this.$project.getBuildConfiguration();

			this.$logger.info("Building project for platform '%s', project configuration '%s', build configuration '%s'",
				settings.platform, settings.projectConfiguration, settings.buildConfiguration);

			this.$project.ensureAllPlatformAssets();
			await this.$projectMigrationService.migrateTypeScriptProject();
			await this.$project.importProject();

			let buildResult = await  this.requestCloudBuild(settings);
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
					let downloadUrl = await  this.getDownloadUrl(urlKind, liveSyncToken, def, settings.projectConfiguration);

					let packageUrl = (urlKind !== "package")
						await ? this.getDownloadUrl("package", liveSyncToken, def, settings.projectConfiguration)
						: downloadUrl;
					this.$logger.debug("Download URL is '%s'", packageUrl);

					return {
						qrUrl: downloadUrl,
						qrImageData: this.$qr.generateDataUri(downloadUrl),
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

				this.showQRCodes(packageDownloadViewModels);
			}

			if (settings.downloadFiles) {
				packageDefs.forEach((pkg: Server.IPackageDef) => {
					let targetFileName: string;
					if (pkg.disposition === this.$projectConstants.ADDITIONAL_FILE_DISPOSITION) {
						targetFileName = path.join(this.$project.getProjectDir(), this.$projectConstants.ADDITIONAL_FILES_DIRECTORY, pkg.fileName);
					} else if (pkg.disposition === this.$projectConstants.BUILD_RESULT_DISPOSITION) {
						targetFileName = settings.downloadedFilePath
							|| path.join(this.$project.getProjectDir(), pkg.fileName);
					} else {
						// We will get here if the disposition is BuildResultMetadata which is not file for download.
						return;
					}

					this.$logger.info("Downloading file '%s/%s' into '%s'", pkg.solution, pkg.fileName, targetFileName);
					let targetFile = this.$fs.createWriteStream(targetFileName);

					if (pkg.format === BuildService.ACCEPT_RESULT_URL) {
						this.$httpClient.httpRequest({
							url: pkg.url,
							pipeTo: targetFile
						await });
					} else {
						await this.$server.filesystem.getContent(pkg.solution, pkg.solutionPath, targetFile);
					}

					this.$logger.info("Download completed: %s", targetFileName);
					pkg.localFile = targetFileName;
				});
			}

			return packageDefs;
	}

	public async buildForDeploy(platform: string, downloadedFilePath: string, buildForiOSSimulator?: boolean, device?: Mobile.IDevice): Promise<IApplicationInformation> {
			platform = this.$mobileHelper.validatePlatformName(platform);
			this.$project.ensureProject();
			let buildResult = this.build({
				platform: platform,
				downloadFiles: true,
				downloadedFilePath: downloadedFilePath,
				buildForiOSSimulator: buildForiOSSimulator,
				device: device
			await });

			let packageName = _.filter(buildResult, (def: Server.IPackageDef) => !def.disposition || def.disposition === "BuildResult")[0].localFile;
			let metadata = _.filter(buildResult, (def: Server.IPackageDef) => def.disposition === "BuildResultMetadata" && def.key === "AppIdentifier")[0];
			let appIdentifier = metadata ? metadata.value : this.$project.projectData.AppIdentifier;
			return {
				packageName,
				appIdentifier
			};
	}

	public async buildForiOSSimulator(downloadedFilePath: string, device?: Mobile.IDevice): Promise<string> {
			let packageFile = (await  this.buildForDeploy(this.$devicePlatformsConstants.iOS, downloadedFilePath, true, device)).packageName;
			let tempDir = this.$project.getTempDir("emulatorFiles");
			await this.$fs.unzip(packageFile, tempDir);
			let appFilePath = path.join(tempDir, this.$fs.readDirectory(tempDir).filter(minimatch.filter("*.app"))[0]);
			return appFilePath;
	}

	public async executeBuild(platform: string, opts?: { buildForiOSSimulator?: boolean }): Promise<void> {
			this.$project.ensureProject();

			if (!this.$project.capabilities.build) {
				this.$errors.failWithoutHelp("This command is not applicable to %s projects ", this.$project.projectData.Framework);
			}

			await this.executeBuildCore(platform, opts);
	}

	private async executeBuildCore(platform: string, opts?: { buildForiOSSimulator?: boolean }): Promise<void> {
			platform = this.$mobileHelper.validatePlatformName(platform);

			if (this.$options.saveTo) {
				this.$options.download = true;
			}

			if (this.$options.download && this.$options.companion) {
				this.$errors.fail("Cannot specify both --download (or --save-to) and --companion options.");
			}

			await this.$loginManager.ensureLoggedIn();

			this.$project.checkSdkVersions(platform);

			if (this.$options.companion) {
				await this.deployToIon(platform);
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
				await });
			}
	}

	private async deployToIon(platform: string): Promise<void> {
			platform = this.$mobileHelper.validatePlatformName(platform);
			if (!this.$mobileHelper.getPlatformCapabilities(platform).companion) {
				this.$errors.fail("The companion app is not available on %s.", platform);
			}

			this.$logger.info("Deploying to AppBuilder companion app.");

			await this.$project.importProject();

			let appIdentifier = await  this.$deviceAppDataFactory.create<ILiveSyncDeviceAppData>(this.$project.getAppIdentifierForPlatform(platform), platform, null);
			let liveSyncToken = await  this.$server.cordova.getLiveSyncToken(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName);

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
			}]);
	}
}

$injector.register("buildService", BuildService);
