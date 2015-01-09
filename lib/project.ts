///<reference path=".d.ts"/>
"use strict";

import minimatch = require("minimatch");
import path = require("path");
var options: any = require("./options");
import util = require("util");
import commonHelpers = require("./common/helpers");
import helpers = require("./helpers");
import os = require("os");
import MobileHelper = require("./common/mobile/mobile-helper");
import projectTypes = require("./project-types");

export class Project implements Project.IProject {
	private cachedProjectDir: string = "";
	private _hasBuildConfigurations: boolean = false;

	public projectData: IProjectData;
	public PROJECT_FILE = ".abproject";

	private static DEBUG_CONFIGURATION_NAME = "debug";
	private static RELEASE_CONFIGURATION_NAME = "release";

	private static JSON_PROJECT_FILE_NAME_REGEX = "[.]abproject";
	private static CONFIGURATION_FILE_SEARCH_PATTERN: RegExp = new RegExp(".*.abproject$", "i");
	private static VALID_CONFIGURATION_CHARACTERS_REGEX = "[-_A-Za-z0-9]";
	private static CONFIGURATION_FROM_FILE_NAME_REGEX = new RegExp("^[.](" + Project.VALID_CONFIGURATION_CHARACTERS_REGEX + "+?)" + Project.JSON_PROJECT_FILE_NAME_REGEX + "$", "i");

	public configurationSpecificData: IDictionary<IDictionary<any>>;

	constructor(private $fs: IFileSystem,
		private $config: IConfiguration,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger,
		private $projectNameValidator: IProjectNameValidator,
		private $errors: IErrors,
		private $resources: IResourceLoader,
		private $templatesService: ITemplatesService,
		private $pathFilteringService: IPathFilteringService,
		private $cordovaMigrationService: ICordovaMigrationService,
		private $projectPropertiesService: IProjectPropertiesService) {

			this.configurationSpecificData = Object.create(null);

			this.readProjectData().wait();

			this.defaultProjectForType = Object.create(null);
			this.defaultProjectForType[projectTypes.Cordova] = this.$config.DEFAULT_CORDOVA_PROJECT_TEMPLATE;
			this.defaultProjectForType[projectTypes.NativeScript] = this.$config.DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE;
			this.defaultProjectForType[projectTypes.MobileWebsite] = this.$config.DEFAULT_WEBSITE_PROJECT_TEMPLATE;

			if(this.projectData && this.projectData["TemplateAppName"]) {
				this.$errors.fail({
					formatStr: "This hybrid project targets Apache Cordova 2.x. " +
					"The AppBuilder CLI lets you target only Apache Cordova 3.0.0 or later. " +
					"To develop your projects with Apache Cordova 2.x, run the AppBuilder Windows client or the in-browser client.",
					suppressCommandHelp: true
				});
			}
	}

	private projectCapabilities: { [key: string]: IProjectCapabilities } = {
		Cordova: {
			build: true,
			buildCompanion: true,
			deploy: true,
			simulate: true,
			livesync: true,
			livesyncCompanion: true,
			updateKendo: true
		},
		NativeScript: {
			build: true,
			buildCompanion: true,
			deploy: true,
			simulate: false,
			livesync: false,
			livesyncCompanion: true,
			updateKendo: false
		},
		MobileWebsite: {
			build: false,
			buildCompanion: false,
			deploy: false,
			simulate: true,
			livesync: false,
			livesyncCompanion: false,
			updateKendo: false
		}
	};

	public get capabilities(): IProjectCapabilities {
		return this.projectCapabilities[this.projectData.Framework];
	}

	public get projectTargets(): IFuture<string[]> {
		return (() => {
			var result: string[] = [], dir: string, fileMask: RegExp;

			if(this.projectType === projectTypes.Cordova) {
				dir = this.getProjectDir().wait();
				fileMask = /^cordova\.(\w*)\.js$/i;
			} else if(this.projectType === projectTypes.NativeScript) {
				dir = path.join(this.getProjectDir().wait(), "app");
				fileMask = /^bootstrap\.(\w*)\.js$/i;
			}

			if (dir) {
				var files = this.$fs.readDirectory(dir).wait();
				var platformFiles = _.each(files, (file) => {
					var matches = file.match(fileMask);
					if(matches) {
						result.push(matches[1].toLowerCase());
					}
				});
			}

			return result;
		}).future<string[]>()();
	}

	public getProjectDir(): IFuture<string> {
		return (() => {
			if(this.cachedProjectDir !== "") {
				return this.cachedProjectDir;
			}
			this.cachedProjectDir = null;

			var projectDir = path.resolve(options.path || ".");
			while(true) {
				this.$logger.trace("Looking for project in '%s'", projectDir);

				if(this.$fs.exists(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME)).wait()) {
					this.$logger.debug("Project directory is '%s'.", projectDir);
					this.cachedProjectDir = projectDir;
					break;
				}

				var dir = path.dirname(projectDir);
				if(dir === projectDir) {
					this.$logger.debug("No project found at or above '%s'.", path.resolve("."));
					break;
				}
				projectDir = dir;
			}

			return this.cachedProjectDir;
		}).future<string>()();
	}

	private static IGNORE_FILE = ".abignore";
	private static INTERNAL_NONPROJECT_FILES = [".ab", Project.IGNORE_FILE, ".*" + Project.IGNORE_FILE, "**/*.ipa", "**/*.apk", "**/*.xap"];
	private defaultProjectForType: any;

	public enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]> {
		return (() => {
			var excludedProjectDirsAndFiles = Project.INTERNAL_NONPROJECT_FILES.
				concat(additionalExcludedProjectDirsAndFiles || []);

			var projectDir = this.getProjectDir().wait();
			var projectFiles = commonHelpers.enumerateFilesInDirectorySync(projectDir, (filePath, stat) => {
				var isExcluded = this.isFileExcluded(path.relative(projectDir, filePath), excludedProjectDirsAndFiles);
				var isSubprojectDir = stat.isDirectory() && this.$fs.exists(path.join(filePath, this.PROJECT_FILE)).wait();
				return !isExcluded && !isSubprojectDir;
			});

			var ignoreFilesRules = <string[]>_(this.ignoreFilesConfigurations)
				.map(configFile => this.$pathFilteringService.getRulesFromFile(path.join(projectDir, configFile)))
				.flatten()
				.value();

			projectFiles = this.$pathFilteringService.filterIgnoredFiles(projectFiles, ignoreFilesRules, projectDir);

			this.$logger.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));
			return projectFiles;
		}).future<string[]>()();
	}

	public isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean {
		var excludedProjectDirsAndFiles = Project.INTERNAL_NONPROJECT_FILES.
			concat(additionalExcludedDirsAndFiles || []);

		var relativeToProjectPath = path.relative(projectDir, filePath);
		return this.isFileExcluded(relativeToProjectPath, excludedProjectDirsAndFiles);
	}

	private isFileExcluded(path: string, exclusionList: string[]): boolean {
		return Boolean(_.find(exclusionList, (pattern) => minimatch(path, pattern, { nocase: true })));
	}

	public saveProject(projectDir?: string): IFuture<void> {
		return (() => {
			projectDir = projectDir || this.getProjectDir().wait();
			this.$fs.writeJson(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME), this.projectData, "\t").wait();

			_.each(this.configurations, (configuration: string) => {
				var configFilePath = path.join(projectDir, util.format(".%s%s", configuration, this.PROJECT_FILE));
				if(this.$fs.exists(configFilePath).wait() && this.configurationSpecificData[configuration]) {
					this.$fs.writeJson(configFilePath, this.configurationSpecificData[configuration]).wait();
				}
			});
		}).future<void>()();
	}

	private readProjectData(): IFuture<void> {
		return (() => {
			var projectDir = this.getProjectDir().wait();

			if (projectDir) {
				var projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
				try {
					var data = this.$fs.readJson(projectFilePath).wait();
					this.projectData = data;

					var allProjectFiles = commonHelpers.enumerateFilesInDirectorySync(projectDir, (file: string, stat: IFsStats) => {
						return Project.CONFIGURATION_FILE_SEARCH_PATTERN.test(file);
					});

					_.each(allProjectFiles, (configProjectFile: string) => {
						var configMatch = path.basename(configProjectFile).match(Project.CONFIGURATION_FROM_FILE_NAME_REGEX);
						if(configMatch && configMatch.length > 1) {
							var configurationName = configMatch[1];
							var configProjectContent = this.$fs.readJson(configProjectFile).wait();
							this.configurationSpecificData[configurationName.toLowerCase()] = configProjectContent;
							this._hasBuildConfigurations = true;
						}
					});

				} catch (err) {
					this.$errors.fail({formatStr: "The project file %s is corrupted." + os.EOL +
						"Consider restoring an earlier version from your source control or backup." + os.EOL +
						"To create a new one with the default settings, delete this file and run $ appbuilder init hybrid." + os.EOL +
						"Additional technical info: %s",
						suppressCommandHelp: true},
						projectFilePath, err.toString());
				}

				if (this.projectType === projectTypes.MobileWebsite) {
					this.$errors.fail("This is a mobile website project. In this version of the Telerik AppBuilder CLI, you cannot work with mobile website projects." +
					" You will be able to develop mobile website projects in a future release.");
				}

				if (this.$projectPropertiesService.completeProjectProperties(this.projectData) && this.$config.AUTO_UPGRADE_PROJECT_FILE) {
					this.saveProject(projectDir).wait();
				}
			}
		}).future<void>()();
	}

	public get projectType(): number {
		return projectTypes[this.projectData.Framework];
	}

	public get configurations(): string[] {
		var configurations: string[] = [];
		if(options.debug || options.d) {
			configurations.push(Project.DEBUG_CONFIGURATION_NAME);
		}

		if(options.release || options.r) {
			configurations.push(Project.RELEASE_CONFIGURATION_NAME);
		}

		if(configurations.length === 0) {
			configurations.push(Project.DEBUG_CONFIGURATION_NAME);
			configurations.push(Project.RELEASE_CONFIGURATION_NAME);
		}

		return configurations;
	}

	public hasBuildConfigurations(): boolean {
		return this._hasBuildConfigurations;
	}

	public getBuildConfiguration(): string {
		return options.release || options.r ? "Release" : "Debug";
	}

	private get ignoreFilesConfigurations(): string[] {
		var configurations: string[] = [ Project.IGNORE_FILE ];
		// unless release is explicitly set, we use debug config
		var configFileName = "." +
			((options.release || options.r) ? Project.RELEASE_CONFIGURATION_NAME : Project.DEBUG_CONFIGURATION_NAME) +
			Project.IGNORE_FILE;
		configurations.push(configFileName);
		return configurations;
	}

	public getProperty(propertyName: string, configuration: string): any {
		var propertyValue: any = null;

		if(this._hasBuildConfigurations) {
			var configData = this.configurationSpecificData[configuration];
			if(configData) {
				propertyValue = configData[propertyName];
			}
		} else {
			propertyValue = this.projectData[propertyName];
		}

		return propertyValue;
	}

	public setProperty(propertyName: string, value: any, configuration: string): void {
		if(this._hasBuildConfigurations) {
			var configData = this.configurationSpecificData[configuration];
			if (!configData) {
				configData = Object.create(null);
				this.configurationSpecificData[configuration] = configData;
			}

			configData[propertyName] = value;
		} else {
			this.projectData[propertyName] = value;
		}
	}

	public createNewProject(projectType: number, projectName: string): IFuture<void> {
		if(!projectName) {
			this.$errors.fail("No project name specified.")
		}

		var projectDir = this.getNewProjectDir();
		return this.createFromTemplate(projectName, projectType, projectDir);
	}

	public createProjectFileFromExistingProject(projectType: number): IFuture<void> {
		return ((): void => {
			var projectDir = this.getNewProjectDir();
			if(!this.$fs.exists(projectDir).wait()) {
				this.$errors.fail({ formatStr: util.format("The specified folder '%s' does not exist!", projectDir), suppressCommandHelp: true });
			}

			var projectFile = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
			if(this.$fs.exists(projectFile).wait()) {
				this.$errors.fail({ formatStr: "The specified folder is already an AppBuilder command line project!", suppressCommandHelp: true });
			}

			var appname = path.basename(projectDir);
			var properties = this.getProjectPropertiesFromExistingProject(projectDir, appname).wait();
			if(!properties) {
				properties = this.alterPropertiesForNewProject({}, appname);
			}

			try {
				this.createProjectFile(projectDir, projectType, properties).wait();
				this.$logger.info("Successfully initialized project in the folder.");
			}
			catch(e) {
				this.$errors.fail("There was an error while initialising the project: " + os.EOL + e);
			}

		}).future<void>()();
	}

	public getSupportedPlugins(): IFuture<string[]> {
		return (() => {
			var version: string;
			if(this.projectData) {
				version = this.projectData.FrameworkVersion;
			} else {
				var selectedFramework = _.last(_.select(this.$cordovaMigrationService.getSupportedFrameworks().wait(), (sv: Server.FrameworkVersion) => sv.DisplayName.indexOf("Experimental") === -1));
				version = selectedFramework.Version;
			}

			return this.$cordovaMigrationService.pluginsForVersion(version).wait();
		}).future<string[]>()();
	}

	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return ((): void => {
			if(newVersion === this.projectData.FrameworkVersion) {
				return;
			}

			var versionDisplayName = this.$cordovaMigrationService.getDisplayNameForVersion(newVersion).wait();
			this.$logger.info("Migrating to Cordova version %s", versionDisplayName);
			var oldVersion = this.projectData.FrameworkVersion;
			var newPluginsList = this.$cordovaMigrationService.migratePlugins(this.projectData.CorePlugins, oldVersion, newVersion).wait();
			this.$logger.trace("Migrated core plugins to: ", helpers.formatListOfNames(newPluginsList, "and"));
			this.projectData.CorePlugins = newPluginsList;

			var successfullyChanged: string[] = [],
				backupSuffix = ".backup";
			try {
				Object.keys(MobileHelper.platformCapabilities).forEach((platform) => {
					this.$logger.trace("Replacing cordova.js file for %s platform ", platform);
					var cordovaJsFileName = path.join(this.getProjectDir().wait(), util.format("cordova.%s.js", platform).toLowerCase());
					var cordovaJsSourceFilePath = this.$resources.buildCordovaJsFilePath(newVersion, platform);
					this.$fs.copyFile(cordovaJsFileName, cordovaJsFileName + backupSuffix).wait();
					this.$fs.copyFile(cordovaJsSourceFilePath, cordovaJsFileName).wait();
					successfullyChanged.push(cordovaJsFileName);
				});
			} catch(error) {
				_.each(successfullyChanged, file => {
					this.$logger.trace("Reverting %s", file);
					this.$fs.copyFile(file + backupSuffix, file).wait();
				});
				throw error;
			}
			finally {
				_.each(successfullyChanged, file => {
					this.$fs.deleteFile(file + backupSuffix).wait();
				});
			}

			this.$logger.info("Successfully migrated to version %s", versionDisplayName);
		}).future<void>()();
	}

	private getProjectPropertiesFromExistingProject(projectDir: string, appname: string): IFuture<IProjectData> {
		return ((): any => {
			var projectFile = _.find(this.$fs.readDirectory(projectDir).wait(), file => {
				var extension = path.extname(file);
				return extension == ".proj" || extension == ".iceproj";
			});

			if(projectFile) {
				return this.$projectPropertiesService.getProjectProperties(path.join(projectDir, projectFile), false).wait();
			}

			this.$logger.warn("No AppBuilder project file found in folder. Creating project with default settings!");
			return null;
		}).future<IProjectData>()();
	}

	private createFromTemplate(appname: string, projectType: number, projectDir: string): IFuture<void> {
		return (() => {
			var templatesDir = this.$templatesService.projectTemplatesDir,
				template = options.template || this.defaultProjectForType[projectType],
				templateFileName: string;

			templateFileName = path.join(templatesDir, this.$templatesService.getTemplateFilename(projectType, template));
			this.$logger.trace("Using template '%s'", templateFileName);
			if(this.$fs.exists(templateFileName).wait()) {
				projectDir = path.join(projectDir, appname);
				this.$logger.trace("Creating template folder '%s'", projectDir);
				this.createTemplateFolder(projectDir).wait();
				try {
					this.$logger.trace("Extracting template from '%s'", templateFileName);
					this.$fs.unzip(templateFileName, projectDir).wait();
					this.$logger.trace("Reading template project properties.");
					var properties = this.$projectPropertiesService.getProjectProperties(path.join(projectDir, this.PROJECT_FILE), true).wait();
					properties = this.alterPropertiesForNewProject(properties, appname);
					this.$logger.trace(properties);
					this.$logger.trace("Saving project file.");
					this.createProjectFile(projectDir, projectType, properties).wait();
					this.$logger.trace("Removing unnecessary files from template.");
					this.removeExtraFiles(projectDir).wait();
					this.$fs.createDirectory(path.join(projectDir, "hooks")).wait();
					this.$logger.info("Project '%s' has been successfully created in '%s'.", appname, projectDir);
				}
				catch(ex) {
					this.$fs.deleteDirectory(projectDir).wait();
					throw ex;
				}
			} else {
				var templates: string;

				switch(projectType) {
					case projectTypes.Cordova:
						templates = this.$templatesService.projectCordovaTemplatesString().wait();
						break;
					case projectTypes.NativeScript:
						templates = this.$templatesService.projectNativeScriptTemplatesString().wait();
						break;
					case projectTypes.MobileWebsite:
						templates = this.$templatesService.projectMobileWebsiteTemplatesString().wait();
						break;
				}

				var message = util.format("The specified template %s does not exist. You can use any of the following templates: %s",
					options.template,
					os.EOL,
					templates);
				this.$errors.fail({ formatStr: message, suppressCommandHelp: true });
			}
		}).future<void>()();
	}

	private removeExtraFiles(projectDir: string): IFuture<void> {
		return ((): void => {
			_.each(["mobile.vstemplate"],
				(file) => this.$fs.deleteFile(path.join(projectDir, file)).wait());
		}).future<void>()();
	}

	private alterPropertiesForNewProject(properties: any, projectName: string): IProjectData {
		properties.ProjectGuid = commonHelpers.createGUID();
		properties.ProjectName = projectName;

		if (properties.Framework !== projectTypes[projectTypes.MobileWebsite]) {
			properties.DisplayName = projectName;
			var appid = options.appid;
			if(!options.appid) {
				appid = this.generateDefaultAppId(projectName);
				this.$logger.warn("--appid was not specified. Defaulting to " + appid)
			}

			properties.AppIdentifier = appid;

			properties.WP8ProductID = commonHelpers.createGUID();
			properties.WP8PublisherID = commonHelpers.createGUID();
			}

		return properties;
	}

	public getNewProjectDir(): string {
		return options.path || process.cwd();
	}

	public createProjectFile(projectDir: string, projectType: number, properties: any): IFuture<void> {
		return ((): void => {
			properties = properties || {};

			this.$fs.createDirectory(projectDir).wait();
			this.cachedProjectDir = projectDir;
			this.projectData = this.$fs.readJson(
				path.join(__dirname,
					util.format("../resources/default-project-%s.json", projectTypes[projectType].toLowerCase()))).wait();

			this.validateProjectData(projectType, properties).wait();
			this.$projectPropertiesService.completeProjectProperties(this.projectData);

			this.saveProject(projectDir).wait();
		}).future<void>()();
	}

	private validateProjectData(projectType: number, properties: any): IFuture<void> {
		return (() => {
			var updateData: any;
			if(!this.propSchema) {
				this.propSchema = helpers.getProjectFileSchema(projectType).wait();
			}

			Object.keys(properties).forEach(propertyName => {
				if(_.has(this.propSchema, propertyName)) {
					if(this.propSchema[propertyName].flags) {
						if(_.isArray(properties[propertyName])) {
							this.projectData[propertyName] = properties[propertyName];
						} else {
							this.projectData[propertyName] = properties[propertyName] !== "" ? properties[propertyName].split(";") : [];
						}
						updateData = this.projectData[propertyName];
					} else {
						this.projectData[propertyName] = properties[propertyName];
						updateData = [this.projectData[propertyName]];
					}

					//triggers validation logic
					this.$projectPropertiesService.updateProjectProperty({}, "set", propertyName, updateData, this.propSchema, false).wait();
				}
			});
		}).future<void>()();
	}

	public createTemplateFolder(projectDir: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(projectDir).wait();
			var projectDirFiles = this.$fs.readDirectory(projectDir).wait();
			if(projectDirFiles.length != 0) {
				throw new Error("The specified directory must be empty to create a new project.");
			}
		}).future<void>()();
	}

	private generateDefaultAppId(appName: string): string {
		var sanitizedName = _.filter(appName.split(""), (c) => /[a-zA-Z0-9]/.test(c)).join("");
		if(sanitizedName) {
			if(/^\d+$/.test(sanitizedName)) {
				sanitizedName = "the" + sanitizedName;
			}
			return "com.telerik." + sanitizedName;
		} else {
			return "com.telerik.the";
		}
	}

	public updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void> {
		return (() => {
			this.ensureProject();
			if(!this.propSchema) {
				this.propSchema = helpers.getProjectFileSchema(projectTypes[this.projectData.Framework]).wait();
			}

			this.$projectPropertiesService.updateProjectProperty(this.projectData, mode, propertyName, propertyValues, this.propSchema, true).wait();
			this.printProjectProperty(propertyName).wait();
			this.saveProject(this.getProjectDir().wait()).wait();
		}).future<void>()();
	}

	public printProjectProperty(property: string): IFuture<void> {
		return (() => {
			this.ensureProject();
			if(!this.propSchema) {
				this.propSchema = helpers.getProjectFileSchema(projectTypes[this.projectData.Framework]).wait();
			}
			property = this.$projectPropertiesService.normalizePropertyName(property, this.propSchema);

			if(this.projectData.hasOwnProperty(property)) {
				this.$logger.out(this.projectData[property]);
			} else if(property) {
				this.$errors.fail("Unrecognized project property '%s'", property);
			} else {
				Object.keys(this.projectData).forEach((propName) => {
					// We get here in case you do not pass property, so we'll print all properties - appbuilder prop print
					this.$logger.out(propName + ": " + this.projectData[propName]);
				});
			}
		}).future<void>()();
	}

	private propSchema: any;
	public validateProjectProperty(property: string, args: string[], mode: string): IFuture<boolean> {
		return (() => {
			this.ensureProject();

			if(!this.propSchema) {
				this.propSchema = helpers.getProjectFileSchema(projectTypes[this.projectData.Framework]).wait();
			}

			property = this.$projectPropertiesService.normalizePropertyName(property, this.propSchema);

			if(this.projectData.hasOwnProperty(property)) {
				var propData = this.propSchema[property];
				if(!propData) {
					this.$errors.fail("Unrecognized project property '%s'", property);
				}

				if(!propData.flags) {
					if(args.length !== 1) {
						this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
					}

					if(mode === "add" || mode === "del") {
						this.$errors.fail("Property '%s' is not a collection of flags. Use prop-set to set a property value.", property);
					}
				}

				return true;
			}

			return false;
		}).future<boolean>()();
	}

	public ensureProject() {
		if(!this.projectData) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}
	}

	public ensureCordovaProject() {
		if(!this.projectData) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}

		if(this.projectType !== projectTypes.Cordova) {
			this.$errors.fail("This is not a valid Cordova project.");
		}
	}

	public getTempDir(extraSubdir?: string): IFuture<string> {
		return (() => {
			var dir = path.join(this.getProjectDir().wait(), ".ab");
			this.$fs.createDirectory(dir).wait();
			if(extraSubdir) {
				dir = path.join(dir, extraSubdir);
				this.$fs.createDirectory(dir).wait();
			}
			return dir;
		}).future<string>()();
	}
}
$injector.register("project", Project);
