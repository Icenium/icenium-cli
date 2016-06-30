import * as path from "path";
import * as temp from "temp";
import * as shelljs from "shelljs";
import * as xmlMapping from "xml-mapping";
import {Project} from "../lib/project";
import {CordovaProject} from "./../lib/project/cordova-project";
import {Yok} from "../lib/common/yok";
import {ProjectConstants} from "../lib/common/appbuilder/project-constants";
import {ResourceLoader} from "../lib/common/resource-loader";
import {PluginsService} from "../lib/services/plugins-service";
import {FrameworkProjectResolver} from "../lib/project/resolvers/framework-project-resolver";
import {IonicProjectTransformator} from "../lib/ionic-project-transformator";
import {ErrorsStub, LoggerStub, PrompterStub} from "./stubs";
import {DevicePlatformsConstants} from "../lib/common/mobile/device-platforms-constants";
import {FileSystem} from "../lib/common/file-system";
import {Configuration, StaticConfig} from "../lib/config";
import {ChildProcess} from "../lib/common/child-process";
import {HostInfo} from "../lib/common/host-info";
import {JsonSchemaValidator} from "../lib/json-schema/json-schema-validator";
import {JsonSchemaConstants} from "../lib/json-schema/json-schema-constants";
import {JsonSchemaLoader} from "../lib/json-schema/json-schema-loader";
import {ProjectPropertiesService} from "../lib/services/project-properties-service";
import {assert} from "chai";
import Future = require("fibers/future");
temp.track();

let ionicBackupFolderName = "Ionic_Backup";
let appResourcesFolderName = "App_Resources";
let configXmlName = "config.xml";
let pathSeparator = path.sep;

interface IConfigXmlFileTestContext {
	platformName: string;
	platformKeyName: string;
	platformDataWithSingleResources: IonicConfigXmlFile.IPlatform;
	platformDataWithMultipleResources: IonicConfigXmlFile.IPlatform;
	clonedConfigXmlDirectory: string;
	expectedIconResource: IonicConfigXmlFile.IResource;
	expectedSplashScreenResource: IonicConfigXmlFile.IResource;
}

function createTestInjector(): IInjector {
	let testInjector = new Yok();
	testInjector.register("injector", testInjector);
	testInjector.register("ionicProjectTransformator", IonicProjectTransformator);
	testInjector.register("fs", FileSystem);
	testInjector.register("projectConstants", ProjectConstants);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("logger", LoggerStub);
	testInjector.register("project", Project);
	testInjector.register("pluginsService", PluginsService);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("config", Configuration);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("prompter", PrompterStub);
	testInjector.register("projectPropertiesService", ProjectPropertiesService);
	testInjector.register("frameworkProjectResolver", FrameworkProjectResolver);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("childProcess", ChildProcess);
	testInjector.register("cordovaProject", CordovaProject);
	testInjector.register("resources", ResourceLoader);
	testInjector.register("jsonSchemaValidator", JsonSchemaValidator);
	testInjector.register("jsonSchemaConstants", JsonSchemaConstants);
	testInjector.register("jsonSchemaLoader", JsonSchemaLoader);
	testInjector.register("cordovaProjectPluginsService", {
		getInstalledPlugins: () => <IPlugin[]>[]
	});
	testInjector.register("cordovaPluginsService", {
		getAvailablePlugins: () => Future.fromResult([])
	});
	testInjector.register("loginManager", {
		ensureLoggedIn: () => Future.fromResult(true)
	});
	testInjector.register("server", {
		cordova: {
			getMarketplacePluginsData: () => Future.fromResult([])
		}
	});
	testInjector.register("cordovaProjectCapabilities", {});
	testInjector.register("nativeScriptProjectCapabilities", {});
	testInjector.register("marketplacePluginsService", {});
	testInjector.register("httpClient", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("configFilesManager", {});
	testInjector.register("cordovaResources", {});
	testInjector.register("multipartUploadService", {});
	testInjector.register("progressIndicator", {});
	testInjector.register("projectFilesManager", {});
	testInjector.register("templatesService", {});
	testInjector.register("options", {});
	testInjector.register("analyticsService", {
		track: () => Future.fromResult()
	});

	return testInjector;
}

let hasUnzippedProject = false;
let unzippedProjectDirectory = temp.mkdirSync("unzipped-project");
let androidPlatformName = "android";
let iosPlatformName = "ios";
let wp8PlatformName = "wp8";

function createIonicProject(testInjector: IInjector, fs: IFileSystem): IFuture<string> {
	return ((): string => {
		if (!hasUnzippedProject) {
			hasUnzippedProject = true;
			fs.unzip(path.join("test", "resources", "ionic-transform-test.zip"), unzippedProjectDirectory, { overwriteExisitingFiles: true }).wait();
		}

		let options = testInjector.resolve("options");
		let projectDirectory = temp.mkdirSync("ionic-transform-test");
		options.path = projectDirectory;
		shelljs.cp("-Rf", [unzippedProjectDirectory + `${pathSeparator}.*`, unzippedProjectDirectory + `${pathSeparator}*`], projectDirectory);

		return projectDirectory;
	}).future<string>()();
}

function createConfigXmlTestsContext(platform: string, appResourcesDirectory: string): IConfigXmlFileTestContext {
	let context: any = {};
	if (platform === androidPlatformName) {
		context.platformName = androidPlatformName;
		context.platformKeyName = androidPlatformName;

		let resourceDensity = "ldpi";
		let drawableFolderName = `drawable-${resourceDensity}`;
		context.platformDataWithSingleResources = {
			name: androidPlatformName,
			icon: <IonicConfigXmlFile.IResource>{
				src: `resources${pathSeparator}android${pathSeparator}icon${pathSeparator}${drawableFolderName}-icon.png`,
				density: resourceDensity
			},
			splash: <IonicConfigXmlFile.IResource>{
				src: `resources${pathSeparator}android${pathSeparator}splash${pathSeparator}${drawableFolderName}-screen.png`,
				density: resourceDensity
			}
		};

		let ionicIconResources = [{
			src: `resources${pathSeparator}android${pathSeparator}icon${pathSeparator}${drawableFolderName}-icon.png`,
			density: resourceDensity
		}, {
				src: `resources${pathSeparator}android${pathSeparator}icon${pathSeparator}${drawableFolderName}-icon.png`,
				density: resourceDensity
			}];

		let ionicSplashScreenResources = [{
			src: `resources${pathSeparator}android${pathSeparator}splash${pathSeparator}${drawableFolderName}-screen.png`,
			density: resourceDensity
		}, {
				src: `resources${pathSeparator}android${pathSeparator}splash${pathSeparator}${drawableFolderName}-screen.png`,
				density: resourceDensity
			}];

		context.platformDataWithMultipleResources = {
			name: androidPlatformName,
			icon: ionicIconResources,
			splash: ionicSplashScreenResources
		};

		context.clonedConfigXmlDirectory = path.join(appResourcesDirectory, "Android", "xml", configXmlName);

		context.expectedIconResource = {
			src: `..${pathSeparator}${drawableFolderName}${pathSeparator}icon.png`
		};
		context.expectedSplashScreenResource = {
			src: `..${pathSeparator}${drawableFolderName}${pathSeparator}screen.png`
		};
	} else if (platform === iosPlatformName) {
		context.platformName = "iOS";
		context.platformKeyName = iosPlatformName;

		context.platformDataWithSingleResources = {
			name: iosPlatformName,
			icon: <IonicConfigXmlFile.IResource>{
				src: `resources${pathSeparator}ios${pathSeparator}icon${pathSeparator}icon.png`
			},
			splash: <IonicConfigXmlFile.IResource>{
				src: `resources${pathSeparator}ios${pathSeparator}splash${pathSeparator}Default-568h@2x~iphone.png`
			}
		};

		let ionicIconResources = [{
			src: `resources${pathSeparator}ios${pathSeparator}icon${pathSeparator}icon.png`
		}, {
				src: `resources${pathSeparator}ios${pathSeparator}icon${pathSeparator}icon.png`
			}];

		let ionicSplashScreenResources = [{
			src: `resources${pathSeparator}ios${pathSeparator}splash${pathSeparator}Default-568h@2x~iphone.png`
		}, {
				src: `resources${pathSeparator}ios${pathSeparator}splash${pathSeparator}Default-568h@2x~iphone.png`
			}];

		context.platformDataWithMultipleResources = {
			name: iosPlatformName,
			icon: ionicIconResources,
			splash: ionicSplashScreenResources
		};

		context.clonedConfigXmlDirectory = path.join(appResourcesDirectory, "iOS", configXmlName);

		context.expectedIconResource = { src: "icon.png" };
		context.expectedSplashScreenResource = { src: "Default-568h@2x~iphone.png" };
	} else if (platform === wp8PlatformName) {
		context.platformName = "WP8";
		context.platformKeyName = wp8PlatformName;

		context.platformDataWithSingleResources = {
			name: wp8PlatformName,
			icon: <IonicConfigXmlFile.IResource>{
				src: `resources${pathSeparator}wp8${pathSeparator}icon${pathSeparator}ApplicationIcon.png`
			},
			splash: <IonicConfigXmlFile.IResource>{
				src: `resources${pathSeparator}wp8${pathSeparator}splash${pathSeparator}SplashScreenImage.png`
			}
		};

		let ionicIconResources = [{
			src: `resources${pathSeparator}wp8${pathSeparator}icon${pathSeparator}ApplicationIcon.png`
		}, {
				src: `resources${pathSeparator}wp8${pathSeparator}icon${pathSeparator}ApplicationIcon.png`
			}];

		let ionicSplashScreenResources = [{
			src: `resources${pathSeparator}wp8${pathSeparator}splash${pathSeparator}SplashScreenImage.png`
		}, {
				src: `resources${pathSeparator}wp8${pathSeparator}splash${pathSeparator}SplashScreenImage.png`
			}];

		context.platformDataWithMultipleResources = {
			name: "wp8",
			icon: ionicIconResources,
			splash: ionicSplashScreenResources
		};

		context.clonedConfigXmlDirectory = path.join(appResourcesDirectory, "WP8", configXmlName);

		context.expectedIconResource = { src: "ApplicationIcon.png" };
		context.expectedSplashScreenResource = { src: "SplashScreenImage.jpg" };
	}

	return context;
}

describe("Ionic project transformator", () => {
	let testInjector: IInjector;
	let ionicProjectTransformator: IIonicProjectTransformator;
	let fs: IFileSystem;
	let projectDirectory: string;
	let createBackup: boolean;

	describe("integration tests", () => {
		beforeEach(() => {
			testInjector = createTestInjector();

			fs = testInjector.resolve("fs");
			projectDirectory = createIonicProject(testInjector, fs).wait();

			ionicProjectTransformator = testInjector.resolve("ionicProjectTransformator");

			createBackup = false;
		});

		it("should create backup if createBackup is true", () => {
			createBackup = true;
			let backupDirectory = path.join(projectDirectory, ionicBackupFolderName);

			ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

			assert.isTrue(fs.exists(backupDirectory).wait());
		});

		it("should not create backup if createBackup is false", () => {
			let backupDirectory = path.join(projectDirectory, ionicBackupFolderName);

			ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

			assert.isTrue(!fs.exists(backupDirectory).wait());
		});

		it("should create full backup of the project", () => {
			createBackup = true;
			let backupDirectory = path.join(projectDirectory, ionicBackupFolderName);
			let projectDirectoryContent = shelljs.ls("-R", projectDirectory);

			ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

			let projectBackupDirectoryContent = shelljs.ls("-R", backupDirectory);

			assert.deepEqual(projectDirectoryContent, projectBackupDirectoryContent);
		});

		it("should create rerouting index.html", () => {
			ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

			let indexHtml = path.join(projectDirectory, "index.html");

			assert.isTrue(fs.exists(indexHtml).wait());
		});

		describe("config.xml cloning", () => {
			let ionicConfigXmlDirectory: string;
			let appResourcesDirectory: string;
			let ionicConfiXml: IonicConfigXmlFile.IConfigXmlFile;
			let context: IConfigXmlFileTestContext;

			beforeEach(() => {
				ionicConfigXmlDirectory = path.join(projectDirectory, configXmlName);
				ionicConfiXml = fs.exists(ionicConfigXmlDirectory).wait() && xmlMapping.tojson(fs.readText(ionicConfigXmlDirectory).wait());
				appResourcesDirectory = path.join(projectDirectory, appResourcesFolderName);
			});

			_.each([androidPlatformName, iosPlatformName, wp8PlatformName], (platform: string) => {
				it(`should clone ${platform} config.xml when ${platform} is added to the Ionic project`, () => {
					context = createConfigXmlTestsContext(platform, appResourcesDirectory);
					ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

					let clonedConfigXmlDirectory = context.clonedConfigXmlDirectory;

					assert.isTrue(fs.exists(clonedConfigXmlDirectory).wait(), `Expected the ${context.platformName} configuration to be cloned from the Ionic config.xml.`);
				});

				it(`should clone correctly for ${platform} when only one resource is added to icon and slpash`, () => {
					context = createConfigXmlTestsContext(platform, appResourcesDirectory);

					ionicConfiXml.widget.platform = context.platformDataWithSingleResources;

					fs.writeFile(ionicConfigXmlDirectory, xmlMapping.toxml(ionicConfiXml)).wait();

					ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

					let clonedConfigXmlDirectory = context.clonedConfigXmlDirectory;

					let appBuilderConfigXml: IonicConfigXmlFile.IConfigXmlFile = xmlMapping.tojson(fs.readText(clonedConfigXmlDirectory).wait());

					let expectedIconResource: IonicConfigXmlFile.IResource = context.expectedIconResource;

					let expectedSplashScreenResource: IonicConfigXmlFile.IResource = context.expectedSplashScreenResource;

					let appBuilderPlatformData = (<IonicConfigXmlFile.IPlatform>appBuilderConfigXml.widget.platform);

					assert.isFalse(_.isArray(appBuilderConfigXml.widget.platform), `Expected ${context.platformName} config.xml to have only the ${context.platformName} configuration.`);
					assert.isFalse(_.isArray(appBuilderPlatformData.icon), `Expected ${context.platformName} config.xml to have only one icon when the Ionic config.xml contains only one icon.`);
					assert.isFalse(_.isArray(appBuilderPlatformData.splash), `Expected ${context.platformName} config.xml to have only one splash screen when the Ionic config.xml contains only one splash screen.`);
					assert.deepEqual((<IonicConfigXmlFile.IResource>appBuilderPlatformData.icon).src, expectedIconResource.src, "Expected the moved icon resource to have correct src.");
					assert.deepEqual((<IonicConfigXmlFile.IResource>appBuilderPlatformData.splash).src, expectedSplashScreenResource.src, "Expected the moved splash screen resource to have correct src.");
				});

				it(`should clone correctly for ${platform} when more than one resource is added to icon and slpash`, () => {
					context = createConfigXmlTestsContext(platform, appResourcesDirectory);

					ionicConfiXml.widget.platform = context.platformDataWithMultipleResources;

					fs.writeFile(ionicConfigXmlDirectory, xmlMapping.toxml(ionicConfiXml)).wait();

					ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

					let clonedConfigXmlDirectory = context.clonedConfigXmlDirectory;

					let appBuilderConfigXml: IonicConfigXmlFile.IConfigXmlFile = xmlMapping.tojson(fs.readText(clonedConfigXmlDirectory).wait());

					let appBuilderPlatformData = (<IonicConfigXmlFile.IPlatform>appBuilderConfigXml.widget.platform);

					assert.isTrue(_.isArray(appBuilderPlatformData.icon), `Expected ${context.platformName} config.xml to have more than one icon when the Ionic config.xml contains more than one icon.`);
					assert.isTrue(_.isArray(appBuilderPlatformData.splash), `Expected ${context.platformName} config.xml to have more than one splash screen when the Ionic config.xml contains more than one splash screen.`);

					assert.deepEqual((<IonicConfigXmlFile.IResource[]>appBuilderPlatformData.icon).length,
						(<IonicConfigXmlFile.IResource[]>context.platformDataWithMultipleResources.icon).length,
						`Expected ${context.platformName} config.xml to have icon resources equal to the icon resources of the Ionic config.xml file for ${context.platformName}.`);
					assert.deepEqual((<IonicConfigXmlFile.IResource[]>appBuilderPlatformData.splash).length,
						(<IonicConfigXmlFile.IResource[]>context.platformDataWithMultipleResources.splash).length,
						`Expected ${context.platformName} config.xml to have splash screen resources equal to the splash screen resources of the Ionic config.xml file for ${context.platformName}.`);
				});
			});

			it(`should clone correctly when more than platform configurations are added to the Ionic config.xml file.`, () => {
				let platformConfigXmlItem: IonicConfigXmlFile.IPlatform[] = [];
				let androidTestContext: IConfigXmlFileTestContext = createConfigXmlTestsContext(androidPlatformName, appResourcesDirectory);
				let iosTestContext: IConfigXmlFileTestContext = createConfigXmlTestsContext(iosPlatformName, appResourcesDirectory);
				let wp8TestContext: IConfigXmlFileTestContext = createConfigXmlTestsContext(wp8PlatformName, appResourcesDirectory);

				platformConfigXmlItem.push(androidTestContext.platformDataWithMultipleResources);
				platformConfigXmlItem.push(iosTestContext.platformDataWithMultipleResources);
				platformConfigXmlItem.push(wp8TestContext.platformDataWithMultipleResources);

				ionicConfiXml.widget.platform = platformConfigXmlItem;

				fs.writeFile(ionicConfigXmlDirectory, xmlMapping.toxml(ionicConfiXml)).wait();

				ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

				assert.isTrue(fs.exists(androidTestContext.clonedConfigXmlDirectory).wait(), "Expected the Android configuration to be cloned.");
				assert.isTrue(fs.exists(iosTestContext.clonedConfigXmlDirectory).wait(), "Expected the iOS configuration to be cloned.");
				assert.isTrue(fs.exists(wp8TestContext.clonedConfigXmlDirectory).wait(), "Expected the WP8 configuration to be cloned.");
			});
		});

		describe("resources cloning", () => {
			it("should clone Android resources correctly.", () => {
				let densityLdpi = "ldpi";
				let densityHdpi = "hdpi";
				let ldpiFolderName = `drawable-${densityLdpi}`;
				let hdpiFolderName = `drawable-${densityHdpi}`;
				let hdpiLandFolderName = `drawable-land-${densityHdpi}`;

				let resourceName = "test-resource";
				let resourceFileName = `${resourceName}.png`;
				let appbuilderAndroidResourcesDirectory = path.join(projectDirectory, appResourcesFolderName, "Android");
				let ionicAndroidResourcesDirectory = path.join(projectDirectory, "resources", androidPlatformName);

				// Clear the Android resources from the template.
				fs.deleteDirectory(ionicAndroidResourcesDirectory).wait();
				fs.createDirectory(path.join(ionicAndroidResourcesDirectory, resourceName)).wait();

				_.each([ldpiFolderName, hdpiFolderName, hdpiLandFolderName], (folderName: string) => {
					shelljs.exec(`echo "test" > ${path.join(ionicAndroidResourcesDirectory, resourceName, `${folderName}-${resourceFileName}`)}`);
				});

				ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

				assert.isTrue(fs.exists(path.join(appbuilderAndroidResourcesDirectory, ldpiFolderName)).wait(), "Expected to get the name of the directory from the Android ionic resource name.");
				assert.isTrue(fs.exists(path.join(appbuilderAndroidResourcesDirectory, hdpiFolderName)).wait(), "Expected to get the name of the directory from the Android ionic resource name.");
				assert.isTrue(fs.exists(path.join(appbuilderAndroidResourcesDirectory, hdpiLandFolderName)).wait(), "Expected to get the name of the directory from the Android ionic resource name for landscape orientation.");
				assert.isTrue(fs.exists(path.join(appbuilderAndroidResourcesDirectory, ldpiFolderName, resourceFileName)).wait(), "Expected to get the name of the resource from the Android ionic resource name.");
				assert.isTrue(fs.exists(path.join(appbuilderAndroidResourcesDirectory, hdpiFolderName, resourceFileName)).wait(), "Expected to get the name of the resource from the Android ionic resource name.");
				assert.isTrue(fs.exists(path.join(appbuilderAndroidResourcesDirectory, hdpiLandFolderName, resourceFileName)).wait(), "Expected to get the name of the resource from the Android ionic resource name for landscape orientation.");
			});

			_.each(["iOS", "WP8"], (appbuilderPlatformName: string) => {
				it(`should clone ${appbuilderPlatformName} resources correctly.`, () => {
					let appbuilderResourcesDirectory = path.join(projectDirectory, appResourcesFolderName, appbuilderPlatformName);
					let ionicResourcesDirectory = path.join(projectDirectory, "resources", appbuilderPlatformName.toLocaleLowerCase());

					// Need to get the list of the resources before the resources folder is deleted.
					let ionicResources = shelljs.ls("-R", path.join(ionicResourcesDirectory, "icon"), path.join(ionicResourcesDirectory, "splash"));

					ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

					// Need to remove the config.xml file from the AppBuilder folder to compare only the resources.
					fs.deleteFile(path.join(appbuilderResourcesDirectory, configXmlName)).wait();

					let differentResources = _.difference(shelljs.ls("-R", appbuilderResourcesDirectory),
						ionicResources);

					if (appbuilderPlatformName === "WP8" && differentResources.length > 0) {
						// Need to check if the splashscreen for WP8 is the difference and exclude it because only the file extension will be different and it is expected.
						differentResources = _.reject(differentResources, (resourceName: string) => resourceName.indexOf("SplashScreenImage") >= 0);
					}

					assert.isTrue(differentResources.length === 0);
				});
			});
		});

		describe("project cleanup", () => {
			it("should delete the Ionic project specific files and folders.", () => {
				let ionicProjectSpecificFilesAndFolders = ["package.json", "ionic.project", ".editorconfig", "hooks", "platforms", "resources"];
				ionicProjectTransformator.transformToAppBuilderProject(createBackup).wait();

				_.each(ionicProjectSpecificFilesAndFolders, (item: string) => {
					assert.isFalse(fs.exists(path.join(projectDirectory, item)).wait(), `Expected ${item} to be deleted.`);
				});
			});
		});
	});
});
