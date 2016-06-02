///<reference path=".d.ts"/>
"use strict";

import * as path from "path";
import * as shelljs from "shelljs";
import * as xmlMapping from "xml-mapping";
import {EOL} from "os";

export class IonicProjectTransformator implements IIonicProjectTransformator {
	private static IONIC_PROJECT_BACKUP_FOLDER_NAME = "Ionic_Backup";
	private static CONFIG_XML_FILE_NAME = "config.xml";
	private static ANDROID_XML_FOLDER_NAME = "xml";
	private static SUPPORTED_SCREEN_SIZES = ["ldpi", "mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
	private static SUPPORTED_LAYOUT_SIZES = ["small", "normal", "large", "xlarge"];
	private static RESOURCE_TYPES = ["drawable", "mipmap"];
	private static XML_RESOURCE_TYPES = ["layout"];

	/// The first orientation is empty string because there can be folder for both orientations (e.g. drawable-hdpi).
	private static SCREEN_ORIENTATIONS = ["", "land", "port"];
	private static WINDOWS_PHONE_SUPPORTED_SPLASH_SCREEN_FORMAT = ".jpg";
	private static WINDOWS_PHONE_IONIC_SPLASH_SCREEN_FORMAT = ".png";
	private supportedScreensFolderNames: string[];
	private _project: Project.IProject;
	private _ionicResourcesDirectory: string;
	private _ionicConfigXml: IonicConfigXmlFile.IConfigXmlFile;
	private _pluginsService: IPluginsService;
	private _appbuilderProjectFiles: string[];

	constructor(private $fs: IFileSystem,
		private $projectConstants: Project.IConstants,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $analyticsService: IAnalyticsService,
		private $logger: ILogger,
		private $injector: IInjector) {
		this.supportedScreensFolderNames = this.createSupportedScreensFoldernames();
	}

	private get $project(): Project.IProject {
		if (!this._project) {
			this._project = this.$injector.resolve("project");
		}

		return this._project;
	}

	private get $pluginsService(): IPluginsService {
		if (!this._pluginsService) {
			this._pluginsService = this.$injector.resolve("pluginsService");
		}

		return this._pluginsService;
	}

	private get appbuilderProjectFiles(): string[] {
		if (!this._appbuilderProjectFiles) {
			this._appbuilderProjectFiles = [
				this.$projectConstants.PROJECT_FILE,
				this.$projectConstants.PROJECT_IGNORE_FILE,
				this.$projectConstants.RELEASE_PROJECT_FILE_NAME,
				this.$projectConstants.DEBUG_PROJECT_FILE_NAME
			];

			_.each([this.$devicePlatformsConstants.Android.toLowerCase(),
				this.$devicePlatformsConstants.iOS.toLowerCase(),
				this.$devicePlatformsConstants.WP8.toLowerCase()], (platformName: string) => {
					this._appbuilderProjectFiles.push(`cordova.${platformName}.js`);
				});
		}

		return this._appbuilderProjectFiles;
	}

	/**
	 * Gets the directory which contains the Ionic resources.
	 */
	private get ionicResourcesDirectory(): string {
		if (!this._ionicResourcesDirectory) {
			this._ionicResourcesDirectory = path.join(this.$project.getProjectDir().wait(), "resources");
		}

		return this._ionicResourcesDirectory;
	}

	/**
	 * Gets the Cordova config.xml of the Ionic project as JavaScript object.
	 */
	private get ionicConfigXml(): IonicConfigXmlFile.IConfigXmlFile {
		if (!this._ionicConfigXml) {
			this._ionicConfigXml = <IonicConfigXmlFile.IConfigXmlFile>xmlMapping.tojson(this.$fs.readText(path.join(this.$project.getProjectDir().wait(), IonicProjectTransformator.CONFIG_XML_FILE_NAME)).wait());
		}

		return this._ionicConfigXml;
	}

	public transformToAppBuilderProject(createBackup: boolean): IFuture<void> {
		return (() => {
			this.$analyticsService.track("Migrate from Ionic", "true").wait();

			if (createBackup) {
				this.backupCurrentProject().wait();
				this.addIonicBackupFolderToAbIgnoreFile().wait();
			}

			this.createReroutingIndexHtml().wait();

			this.cloneResources().wait();

			this.deleteEnabledPlugins().wait();

			this.deleteAssortedFilesAndDirectories();
		}).future<void>()();
	}

	/**
	 * Clones the resources from the Ionic resources folder to App_Resources folder.
	 */
	private cloneResources(): IFuture<void> {
		return (() => {
			if (!this.$fs.exists(this.ionicResourcesDirectory).wait()) {
				return;
			}

			let appBuilderResourcesDirectory = path.join(this.$project.getProjectDir().wait(), "App_Resources");

			// Currently the default template does not add App_Resources directory.
			if (!this.$fs.exists(appBuilderResourcesDirectory).wait()) {
				this.$fs.createDirectory(appBuilderResourcesDirectory).wait();
			}

			this.cloneConfigXml(appBuilderResourcesDirectory).wait();

			console.log(`-------Cloning Android resources started at ${new Date()}`);
			this.cloneResourcesCore(this.ionicResourcesDirectory, appBuilderResourcesDirectory, this.$devicePlatformsConstants.Android.toLowerCase(), this.copyAndroidResources).wait();
			console.log(`-------Cloning Android resources ended at ${new Date()}`);
			console.log(`-------Cloning iOS resources started at ${new Date()}`);
			this.cloneResourcesCore(this.ionicResourcesDirectory, appBuilderResourcesDirectory, this.$devicePlatformsConstants.iOS.toLowerCase(), this.copyResources).wait();
			console.log(`-------Cloning iOS resources ended at ${new Date()}`);
			console.log(`-------Cloning WP8 resources started at ${new Date()}`);
			this.cloneResourcesCore(this.ionicResourcesDirectory, appBuilderResourcesDirectory, this.$devicePlatformsConstants.WP8.toLowerCase(), this.copyWindowsPhoneResources).wait();
			console.log(`-------Cloning WP8 resources started at ${new Date()}`);
		}).future<void>()();
	}

	/**
	 * Reads the Ionic config.xml and creates config.xml for each platform in the App_Resources/<platform> folder with the resources described for the platform.
	 */
	private cloneConfigXml(appBuilderResourcesDirectory: string): IFuture<void> {
		return (() => {
			//  When creating JavaScript object from xml file some properties can be created as property with single value or property with array of values thats why wee need to check if is array.
			if (_.isArray(this.ionicConfigXml.widget.platform)) {
				_.each(this.ionicConfigXml.widget.platform, (platform: IonicConfigXmlFile.IPlatform) => {
					this.cloneConfigXmlCore(appBuilderResourcesDirectory, platform).wait();
				});
			} else {
				this.cloneConfigXmlCore(appBuilderResourcesDirectory, <IonicConfigXmlFile.IPlatform>this.ionicConfigXml.widget.platform).wait();
			}

		}).future<void>()();
	}

	private cloneConfigXmlCore(appBuilderResourcesDirectory: string, platform: IonicConfigXmlFile.IPlatform): IFuture<void> {
		return (() => {
			if (!platform) {
				// There are no platform specific resources in the Ionic config.xml.
				return;
			}

			let appBuilderPlatformResourcesDirectory = path.join(appBuilderResourcesDirectory, this.$projectConstants.APPBUILDER_PROJECT_PLATFORMS_NAMES[platform.name]);
			let platformConfigXml: IonicConfigXmlFile.IConfigXmlFile = {};
			platformConfigXml.widget = this.ionicConfigXml.widget;
			// The platform property should be set to empty object to remove the data for the other platforms.
			platformConfigXml.widget.platform = <IonicConfigXmlFile.IPlatform>{};
			(<IonicConfigXmlFile.IPlatform>platformConfigXml.widget.platform).name = platform.name;

			// AppBuilder config.xml for Android must be placed in the xml folder.
			let platformConfigXmlDestinationDirectory = platform.name === this.$devicePlatformsConstants.Android.toLowerCase() ? path.join(appBuilderPlatformResourcesDirectory, IonicProjectTransformator.ANDROID_XML_FOLDER_NAME) : appBuilderPlatformResourcesDirectory;

			(<IonicConfigXmlFile.IPlatform>platformConfigXml.widget.platform).icon = this.changeXmlResourcesSources("icon", platform, appBuilderResourcesDirectory, platformConfigXmlDestinationDirectory, appBuilderPlatformResourcesDirectory).wait();
			(<IonicConfigXmlFile.IPlatform>platformConfigXml.widget.platform).splash = this.changeXmlResourcesSources("splash", platform, appBuilderResourcesDirectory, platformConfigXmlDestinationDirectory, appBuilderPlatformResourcesDirectory).wait();

			this.$fs.writeFile(path.join(platformConfigXmlDestinationDirectory, IonicProjectTransformator.CONFIG_XML_FILE_NAME), xmlMapping.toxml(platformConfigXml)).wait();
		}).future<void>()();
	}

	/**
	 * Changes the src property of the resource item for platform to be relative to the AppBuilder platform specific config.xml.
	 */
	private changeXmlResourcesSources(resourceType: string,
		platform: IonicConfigXmlFile.IPlatform,
		appBuilderResourcesDirectory: string,
		platformConfigXmlDestinationDirectory: string,
		appBuilderPlatformResourcesDirectory: string): IFuture<IonicConfigXmlFile.IResource[]> {
		return (() => {
			let result: IonicConfigXmlFile.IResource[] = [];

			// Platform should be cast to any because the linter fails with "Index signature of object type implicitly has an 'any' type".
			let platformResource: IonicConfigXmlFile.IResource = (<any>platform)[resourceType];

			if (_.isArray(platformResource)) {
				_.each(platformResource, (resourceTypeItem: IonicConfigXmlFile.IResource) => {
					// Some projects may not have splash screen or icon resources in their Ionic config.xml file.
					if (resourceTypeItem) {
						let appBuilderResource = this.createNewResourceItem(resourceType, appBuilderResourcesDirectory, platformConfigXmlDestinationDirectory, appBuilderPlatformResourcesDirectory, resourceTypeItem, platform.name).wait();
						result.push(appBuilderResource);
					}
				});
			} else {
				// Some projects may not have splash screen or icon resources in their Ionic config.xml file.
				if (platformResource) {
					let appBuilderResource = this.createNewResourceItem(resourceType, appBuilderResourcesDirectory, platformConfigXmlDestinationDirectory, appBuilderPlatformResourcesDirectory, platformResource, platform.name).wait();
					result.push(appBuilderResource);
				}
			}

			return result;
		}).future<IonicConfigXmlFile.IResource[]>()();
	}

	private createNewResourceItem(resourceType: string,
		appBuilderResourcesDirectory: string,
		platformConfigXmlDestinationDirectory: string,
		appBuilderPlatformResourcesDirectory: string,
		resource: IonicConfigXmlFile.IResource,
		platformName: string): IFuture<IonicConfigXmlFile.IResource> {
		return (() => {
			let iconSourceFolder = <string>resource.src;

			// The path to the resource will depend on what operating system the project was created on.
			let resourceName = _.last(iconSourceFolder.indexOf("\\") >= 0 ? iconSourceFolder.split("\\") : iconSourceFolder.split("/"));

			// Windows Phone 8 supports only JPG splash screens and Ionic provides PNG splash screens.
			if (platformName === this.$devicePlatformsConstants.WP8.toLowerCase() && resourceType === "splash") {
				resourceName = resourceName.replace(IonicProjectTransformator.WINDOWS_PHONE_IONIC_SPLASH_SCREEN_FORMAT, IonicProjectTransformator.WINDOWS_PHONE_SUPPORTED_SPLASH_SCREEN_FORMAT);
			}

			if (platformName === this.$devicePlatformsConstants.Android.toLowerCase()) {
				platformConfigXmlDestinationDirectory = path.join(appBuilderResourcesDirectory, this.$projectConstants.APPBUILDER_PROJECT_PLATFORMS_NAMES[platformName], IonicProjectTransformator.ANDROID_XML_FOLDER_NAME);

				// Ionic resource name will be <resourceType>-<orientationAndDensity>-<name>.
				let androidResourceInformation = resourceName.split(`-${resource.density}-`);
				let androidActualResourceName = _.last(androidResourceInformation);
				let androidResourceType = _.first(androidResourceInformation);

				resource.src = path.relative(path.join(platformConfigXmlDestinationDirectory), path.join(appBuilderPlatformResourcesDirectory, `${androidResourceType}-${resource.density}`, androidActualResourceName));
			} else {
				resource.src = resourceName;
			}

			return resource;
		}).future<IonicConfigXmlFile.IResource>()();
	}

	private cloneResourcesCore(projectDir: string, appBuilderResourcesDirectory: string, platformKeyName: string, cloneFunction: Function): IFuture<void> {
		return (() => {
			let ionicPlatformName = this.$projectConstants.IONIC_PROJECT_PLATFORMS_NAMES[platformKeyName];
			let appBuilderPlatformName = this.$projectConstants.APPBUILDER_PROJECT_PLATFORMS_NAMES[platformKeyName];

			let ionicPlatformResourcesDirectory = path.join(this.ionicResourcesDirectory, ionicPlatformName);

			if (!this.checkIfPlatformIsAddedToProject(this.ionicResourcesDirectory, ionicPlatformName).wait() ||
				!this.$fs.getFsStats(ionicPlatformResourcesDirectory).wait().isDirectory()) {
				return;
			}

			let ionicPlatformResources = this.$fs.readDirectory(ionicPlatformResourcesDirectory).wait();

			let appbuilderPlatformResourcesDirectory = path.join(appBuilderResourcesDirectory, appBuilderPlatformName);
			if (!this.$fs.exists(appbuilderPlatformResourcesDirectory).wait()) {
				this.$fs.createDirectory(appbuilderPlatformResourcesDirectory).wait();
			}

			_.each(ionicPlatformResources, (resourceName: string) => {
				let resourceDirectory = path.join(ionicPlatformResourcesDirectory, resourceName);
				if (!this.$fs.getFsStats(resourceDirectory).wait().isDirectory()) {
					return;
				}

				let resources = this.$fs.readDirectory(resourceDirectory).wait();

				_.each(resources, (ionicResourceName: string) => {
					cloneFunction.apply(this, [resourceDirectory, appbuilderPlatformResourcesDirectory, ionicResourceName, resourceName]).wait();
				});
			});
		}).future<void>()();
	}

	private copyWindowsPhoneResources(resourceDirectory: string, appBuilderWindowsPhoneResourcesDirectory: string): IFuture<void> {
		return (() => {
			if (!this.$fs.getFsStats(resourceDirectory).wait().isDirectory()) {
				return;
			}

			let allResources = this.$fs.readDirectory(resourceDirectory).wait();
			let ionicWindowsPhoneConfig: IonicConfigXmlFile.IPlatform;

			if (_.isArray(this.ionicConfigXml.widget.platform)) {
				ionicWindowsPhoneConfig = _.filter(<IonicConfigXmlFile.IPlatform[]>this.ionicConfigXml.widget.platform, (platform: IonicConfigXmlFile.IPlatform) => platform.name === this.$devicePlatformsConstants.WP8.toLowerCase())[0];
			} else {
				ionicWindowsPhoneConfig = (<IonicConfigXmlFile.IPlatform>this.ionicConfigXml.widget.platform).name === this.$devicePlatformsConstants.WP8.toLowerCase() ? <IonicConfigXmlFile.IPlatform>this.ionicConfigXml.widget.platform : null;
			}

			// Windows Phone 8 supports only JPG splash screens and Ionic projects provides PNG splash screens.
			if (ionicWindowsPhoneConfig) {
				_.each(allResources, (item: string) => {
					let resourceItemSourceDirectory = path.join(resourceDirectory, item);
					let resourceDestinationDirectory = path.join(appBuilderWindowsPhoneResourcesDirectory, item);
					if (this.$fs.getFsStats(resourceItemSourceDirectory).wait().isFile()) {
						let itemNameWithoutExtension = item.substring(0, item.lastIndexOf("."));
						if (_.isArray(ionicWindowsPhoneConfig.splash)) {
							if (_.any(ionicWindowsPhoneConfig.splash, (splash: IonicConfigXmlFile.IResource) => splash.src.indexOf(itemNameWithoutExtension) >= 0)) {
								resourceDestinationDirectory = resourceDestinationDirectory.replace(IonicProjectTransformator.WINDOWS_PHONE_IONIC_SPLASH_SCREEN_FORMAT, IonicProjectTransformator.WINDOWS_PHONE_SUPPORTED_SPLASH_SCREEN_FORMAT);
							}
						} else {
							if ((<IonicConfigXmlFile.IResource>ionicWindowsPhoneConfig.splash).src.indexOf(itemNameWithoutExtension) >= 0) {
								resourceDestinationDirectory = resourceDestinationDirectory.replace(IonicProjectTransformator.WINDOWS_PHONE_IONIC_SPLASH_SCREEN_FORMAT, IonicProjectTransformator.WINDOWS_PHONE_SUPPORTED_SPLASH_SCREEN_FORMAT);
							}
						}

						this.$fs.copyFile(path.join(resourceDirectory, item), resourceDestinationDirectory).wait();
					} else {
						this.$fs.copyDirRecursive(resourceItemSourceDirectory, resourceDestinationDirectory).wait();
						// shelljs.cp("-R", resourceItemSourceDirectory, resourceDestinationDirectory);
					}
				});
			} else {
				// If there are no specific resources for wp8 the copy is straightforward.
				this.copyResources(resourceDirectory, appBuilderWindowsPhoneResourcesDirectory).wait();
			}
		}).future<void>()();
	}

	private copyResources(resourceDirectory: string, appBuilderPlatformResourcesDirectory: string): IFuture<void> {
		return (() => {
			// Need to add / at the end of resourceDirectory to copy the content of the directory directly to appBuilderPlatformResourcesDirectory not in subfolder.
			let resourceDirectoryContentPath = `${resourceDirectory}/`;

			this.$fs.copyDirRecursive(resourceDirectoryContentPath, appBuilderPlatformResourcesDirectory).wait();
			// shelljs.cp("-r", resourceDirectoryContentPath, appBuilderPlatformResourcesDirectory);
		}).future<void>()();
	}

	private copyAndroidResources(resourceDirectory: string, appBuilderAndroidResourcesDirectory: string, ionicResourceName: string): IFuture<void> {
		return (() => {
			_.each(this.supportedScreensFolderNames, (folderName: string) => {
				if (ionicResourceName.indexOf(folderName) >= 0) {
					// Android resources in Ionic projects contain the resolution folder name in the resource name (e.g. drawable-hdpi-icon.png).
					let resourceName = ionicResourceName.split(`${folderName}-`)[1];

					let resourceDestinationDirectory = path.join(appBuilderAndroidResourcesDirectory, folderName, resourceName);

					this.$fs.copyFile(path.join(resourceDirectory, ionicResourceName), resourceDestinationDirectory).wait();
					return false;
				}
			});
		}).future<void>()();
	}

	private checkIfPlatformIsAddedToProject(resourcesDirectory: string, platformName: string): IFuture<boolean> {
		return this.$fs.exists(path.join(resourcesDirectory, platformName));
	}

	private backupCurrentProject(): IFuture<void> {
		return (() => {
			let ionicProjectBackupDir = path.join(this.$project.getProjectDir().wait(), IonicProjectTransformator.IONIC_PROJECT_BACKUP_FOLDER_NAME);

			this.$logger.warn(`Creating backup in ${ionicProjectBackupDir}. This could take more than one minute. Please be patient.`);

			// Use -A to get only the folders and files names without the "." and ".." entries.
			let allProjectItems = shelljs.ls("-A", this.$project.getProjectDir().wait());

			if (this.$fs.exists(ionicProjectBackupDir).wait()) {
				this.$fs.deleteDirectory(ionicProjectBackupDir).wait();
			}

			this.$fs.createDirectory(ionicProjectBackupDir).wait();

			// Cannot copy directly project dir to the backup dir because it will end up in endless recursion.
			_.each(allProjectItems, (item: string) => {
				if (item.indexOf(IonicProjectTransformator.IONIC_PROJECT_BACKUP_FOLDER_NAME) < 0) {
					let itemSourceDirectory = path.join(this.$project.getProjectDir().wait(), item);
					let itemDestinationDirectory = path.join(ionicProjectBackupDir, item);
					if (this.$fs.getFsStats(itemSourceDirectory).wait().isDirectory()) {
						shelljs.cp("-R", `${itemSourceDirectory}/`, `${itemDestinationDirectory}`);
					} else if (!this.isAppBuilderProjectFile(itemSourceDirectory)) {
						this.$fs.copyFile(itemSourceDirectory, itemDestinationDirectory).wait();
					}
				}
			});
		}).future<void>()();
	}

	/**
	 * Creates index.html file which will redirect to the index.html file of the Ionic project.
	 */
	private createReroutingIndexHtml(): IFuture<void> {
		return (() => {
			const indexHtmlContent = '<html><head><meta http-equiv="refresh" content="0; url=www/index.html" /></head></html>';
			let indexHtml = path.join(this.$project.getProjectDir().wait(), "index.html");
			this.$fs.writeFile(indexHtml, indexHtmlContent).wait();
		}).future<void>()();
	}

	private deleteEnabledPlugins(): IFuture<void> {
		return (() => {
			let corePlugins = this.$pluginsService.getInstalledPlugins().map(pl => pl.data.Name);
			let pluginsDir = path.join(this.$project.getProjectDir().wait(), "plugins");
			(this.$fs.readDirectory(pluginsDir).wait() || [])
				.filter(pl => _.contains(corePlugins, pl))
				.forEach(pl => this.$fs.deleteDirectory(path.join(pluginsDir, pl)).wait());
		}).future<void>()();
	}

	private deleteAssortedFilesAndDirectories() {
		let projectDir = this.$project.getProjectDir().wait();
		let assortedFilesAndDirectories = ["platforms", "hooks", "resources", ".editorconfig", "ionic.project", "package.json"];
		let itemsToRemove = _.map(assortedFilesAndDirectories, (item: string) => path.join(projectDir, item));

		try {
			this.$fs.rm("-rf", ...itemsToRemove);
		} catch (e) {
			// Some files do not exist in older ionic projects, ignore the error.
			this.$logger.trace(`Deleting unexisting file from Ionic project: ${e}`);
		}
	}

	private createSupportedScreensFoldernames(): string[] {
		let result: string[] = [];

		// Merge resource types with supported screen sizes and orientations.
		result = result.concat(this.mergeFolderNames(IonicProjectTransformator.RESOURCE_TYPES, IonicProjectTransformator.SUPPORTED_SCREEN_SIZES));

		// Merge xml resource types with supported layout sizes and orientations.
		result = result.concat(this.mergeFolderNames(IonicProjectTransformator.XML_RESOURCE_TYPES, IonicProjectTransformator.SUPPORTED_LAYOUT_SIZES));

		return result;
	}

	private mergeFolderNames(resourceTypes: string[], screenSizes: string[]): string[] {
		let folderNames: string[] = [];

		// For each resource type (drawable, layout...) should be generated folder name with each screen size and each orientation.
		_.each(resourceTypes, (resourceType: string) => {
			// Each screen size should be combinated with each orientation.
			_.each(IonicProjectTransformator.SCREEN_ORIENTATIONS, (screenOriantation: string) => {
				_.each(screenSizes, (screenSize: string) => {
					let folderName = resourceType;

					// Check if orientation should be added to the folder name.
					if (screenOriantation.length) {
						folderName += `-${screenOriantation}`;
					}

					folderName += `-${screenSize}`;

					folderNames.push(folderName);
				});
			});
		});
		return folderNames;
	}

	private isAppBuilderProjectFile(file: string): boolean {
		let isAppBuilderFile = false;
		_.each(this.appbuilderProjectFiles, (appBuilderFileName: string) => {
			if (file.indexOf(appBuilderFileName) >= 0) {
				isAppBuilderFile = true;
				return false;
			}
		});

		return isAppBuilderFile;
	}

	private addIonicBackupFolderToAbIgnoreFile(): IFuture<void> {
		return (() => {
			let abIgnoreFilePath = path.join(this.$project.projectDir, this.$projectConstants.PROJECT_IGNORE_FILE);

			let ignoreText = `${EOL}# Ionic backup folder${EOL}${IonicProjectTransformator.IONIC_PROJECT_BACKUP_FOLDER_NAME}${EOL}`;

			this.$fs.appendFile(abIgnoreFilePath, ignoreText).wait();
		}).future<void>()();
	}
}

$injector.register("ionicProjectTransformator", IonicProjectTransformator);
