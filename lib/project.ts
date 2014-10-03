///<reference path=".d.ts"/>
"use strict";
import minimatch = require("minimatch");
import path = require("path");
var options:any = require("./options");
import util = require("util");
import commonHelpers = require("./common/helpers");
import helpers = require("./helpers");
import os = require("os");
import MobileHelper = require("./common/mobile/mobile-helper");

export class Project implements Project.IProject {
	private cachedProjectDir: string = "";
	public projectData: IProjectData;
	public PROJECT_FILE = ".abproject";

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
		private $projectPropertiesService: IProjectPropertiesService,
		private $projectTypes: IProjectTypes) {
			this.readProjectData().wait();

			this.defaultProjectForType = Object.create(null);
			this.defaultProjectForType[this.$projectTypes.Cordova] = this.$config.DEFAULT_CORDOVA_PROJECT_TEMPLATE;
			this.defaultProjectForType[this.$projectTypes.NativeScript] = this.$config.DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE;

			if (this.projectData && this.projectData["TemplateAppName"]) {
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
			build: false,
			buildCompanion: true,
			deploy: false,
			simulate: false,
			livesync: false,
			livesyncCompanion: true,
			updateKendo: false
		}
	};

	public get capabilities(): IProjectCapabilities {
		return this.projectCapabilities[this.projectData.Framework];
	}

	public get projectTargets(): IFuture<string[]> {
		return (() => {
			var result: string[] = [], dir: string, fileMask: RegExp;

			if (this.projectType === this.$projectTypes.Cordova) {
				dir = this.getProjectDir().wait();
				fileMask = /^cordova\.(\w*)\.js$/i;
			} else { // NativeScript
				dir = path.join(this.getProjectDir().wait(), "app");
				fileMask = /^bootstrap\.(\w*)\.js$/i;
			}

			var files = this.$fs.readDirectory(dir).wait();
			var platformFiles = _.each(files, (file) => {
				var matches = file.match(fileMask);
				if (matches) {
					result.push(matches[1].toLowerCase());
				}
			});

			return result;
		}).future<string[]>()();
	}

	public getProjectDir(): IFuture<string> {
		return (() => {
			if (this.cachedProjectDir !== "") {
				return this.cachedProjectDir;
			}
			this.cachedProjectDir = null;

			var projectDir = path.resolve(options.path || ".");
			while (true) {
				this.$logger.trace("Looking for project in '%s'", projectDir);

				if (this.$fs.exists(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME)).wait()) {
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
		}).future<string>()();
	}

	private static IGNORE_FILE = ".abignore";
	private static INTERNAL_NONPROJECT_FILES = [".ab", Project.IGNORE_FILE, "**/*.ipa", "**/*.apk", "**/*.xap"];
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

			var ignoreFilesRules = this.$pathFilteringService.getRulesFromFile(path.join(projectDir, Project.IGNORE_FILE));

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
		return Boolean(_.find(exclusionList, (pattern) => minimatch(path, pattern, {nocase: true})));
	}

	public saveProject(projectDir: string): IFuture<void> {
		return this.$fs.writeJson(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME), this.projectData, "\t");
	}

	private readProjectData(): IFuture<void> {
		return (() => {
			var projectDir = this.getProjectDir().wait();
			if (projectDir) {
				var data = this.$fs.readJson(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME)).wait();
				this.projectData = data;

				if (this.$projectPropertiesService.completeProjectProperties(this.projectData) && this.$config.AUTO_UPGRADE_PROJECT_FILE) {
					this.saveProject(projectDir).wait();
				}
			}
		}).future<void>()();
	}

	public get projectType(): number {
		return this.$projectTypes[this.projectData.Framework];
	}

	public createNewProject(projectType: number, projectName: string): IFuture<void> {
		return ((): void => {
			if (!projectName) {
				this.$errors.fail("No project name specified.")
			}
			this.$projectNameValidator.validate(projectName);

			var projectDir = this.getNewProjectDir();
			this.createFromTemplate(projectName, projectType, projectDir).wait();
		}).future<void>()();
	}

	public createProjectFileFromExistingProject(projectType: number): IFuture<void> {
		return ((): void => {
			var projectDir = this.getNewProjectDir();

			if (!this.$fs.exists(projectDir).wait()) {
				this.$errors.fail({ formatStr: util.format("The specified folder '%s' does not exist!", projectDir), suppressCommandHelp: true });
			}

			var projectFile = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
			if (this.$fs.exists(projectFile).wait()) {
				this.$errors.fail({ formatStr: "The specified folder is already an AppBuilder command line project!", suppressCommandHelp: true });
			}

			var appname = path.basename(projectDir);
			var properties = this.getProjectPropertiesFromExistingProject(projectDir, appname).wait();
			if (!properties) {
				properties = this.alterPropertiesForNewProject({}, appname);
			}

			try {
				this.createProjectFile(projectDir, projectType, properties).wait();
				this.$logger.info("Successfully initialized project in the folder.");
			}
			catch (e) {
				this.$errors.fail("There was an error while initialising the project: " + os.EOL + e);
			}

		}).future<void>()();
	}

	public getSupportedPlugins(): IFuture<string[]> {
		return (() => {
			var version: string;
			if (this.projectData) {
				version = this.projectData.FrameworkVersion;
			} else {
				version = _.last(this.$cordovaMigrationService.getSupportedVersions().wait());
			}
			
			return this.$cordovaMigrationService.pluginsForVersion(version).wait();
		}).future<string[]>()();
	}

	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return ((): void => {
			if (newVersion === this.projectData.FrameworkVersion) {
				return;
			}

			this.$logger.info("Migrating to cordova version %s", newVersion);
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
			} catch (error) {
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

			this.$logger.info("Successfully migrated to version %s", newVersion);
		}).future<void>()();
	}

	private getProjectPropertiesFromExistingProject(projectDir: string, appname: string): IFuture<IProjectData> {
		return ((): any => {
			var projectFile = _.find(this.$fs.readDirectory(projectDir).wait(), file => {
 				var extension = path.extname(file);
 				return extension == ".proj" || extension == ".iceproj";
			});

			if (projectFile) {
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
			if (this.$fs.exists(templateFileName).wait()) {
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
					this.$logger.info("Project '%s' has been successfully created in '%s'.", appname, projectDir);
				}
				catch (ex) {
					this.$fs.deleteDirectory(projectDir).wait();
					throw ex;
				}
			} else {
				var message = util.format("The specified template %s does not exist. You can use any of the following templates: %s",
					options.template,
					os.EOL,
					(projectType === this.$projectTypes.Cordova) ? this.$templatesService.projectCordovaTemplatesString() : this.$templatesService.projectNativeScriptTemplatesString());
				this.$errors.fail({formatStr: message, suppressCommandHelp: true});
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
		properties.ProjectName = projectName;
		properties.DisplayName = projectName;
		var appid = options.appid;
		if (!options.appid) {
			appid = this.generateDefaultAppId(projectName);
			this.$logger.warn("--appid was not specified. Defaulting to " + appid)
		}

		properties.AppIdentifier = appid;
		properties.ProjectGuid = commonHelpers.createGUID();

		if (!properties.WP8ProductID) {
			properties.WP8ProductID = commonHelpers.createGUID();
		}
		if (!properties.WP8PublisherID) {
			properties.WP8PublisherID = commonHelpers.createGUID();
		}

		return properties;
	}

	private getNewProjectDir() {
		return options.path || process.cwd();
	}

	public createProjectFile(projectDir: string, projectType: number, properties: any): IFuture<void> {
		return ((): void => {
			properties = properties || {};

			this.$fs.createDirectory(projectDir).wait();
			this.cachedProjectDir = projectDir;
			this.projectData = this.$fs.readJson(
				path.join(__dirname,
					util.format("../resources/default-project-%s.json", this.$projectTypes[projectType].toLowerCase()))).wait();

			this.validateProjectData(projectType, properties).wait();
			this.$projectPropertiesService.completeProjectProperties(this.projectData);

			this.saveProject(projectDir).wait();
		}).future<void>()();
	}

	private validateProjectData(projectType: number, properties: any): IFuture<void> {
		return (() => {
			var updateData: any;
			var projectSchema = helpers.getProjectFileSchema(projectType).wait();
			Object.keys(properties).forEach(propertyName => {
				if (_.has(projectSchema, propertyName)) {
					if (projectSchema[propertyName].flags) {
						if (_.isArray(properties[propertyName])) {
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
					this.$projectPropertiesService.updateProjectProperty({}, "set", propertyName, updateData, projectSchema, false).wait();
				}
			});
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

	public updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void> {
		return (() => {
			this.ensureProject();

			var propSchema = helpers.getProjectFileSchema(this.$projectTypes[this.projectData.Framework]).wait();
			this.$projectPropertiesService.updateProjectProperty(this.projectData, mode, propertyName, propertyValues, propSchema, true).wait();
			this.printProjectProperty(propertyName).wait();
			this.saveProject(this.getProjectDir().wait()).wait();
		}).future<void>()();
	}

	public printProjectProperty(property: string): IFuture<void> {
		return (() => {
			this.ensureProject();
			var propSchema = helpers.getProjectFileSchema(this.$projectTypes[this.projectData.Framework]).wait();
			property = this.$projectPropertiesService.normalizePropertyName(property, propSchema);

			if (this.projectData.hasOwnProperty(property)) {
				this.$logger.out(this.projectData[property]);
			} else if (property) {
				this.$errors.fail("Unrecognized project property '%s'", property);
			} else {
				Object.keys(this.projectData).forEach((propName) => {
					this.$logger.out(propName + ": " + this.projectData[propName]);
				});
			}
		}).future<void>()();
	}

	public ensureProject() {
		if (!this.projectData) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}
	}

	public getTempDir(extraSubdir?:string): IFuture<string> {
		return(() => {
			var dir = path.join(this.getProjectDir().wait(), ".ab");
			this.$fs.createDirectory(dir).wait();
			if (extraSubdir) {
				dir = path.join(dir, extraSubdir);
				this.$fs.createDirectory(dir).wait();
			}
			return dir;
		}).future<string>()();
	}
}
$injector.register("project", Project);

// register prop * commands
_.each(["add", "set", ["del", "rm"], ["del", "remove"]], (operation) => {
	var propOperation = operation;
	if (_.isArray(operation)) {
		propOperation = operation[1];
		operation = operation[0];
	}

	helpers.registerCommand("project", "prop|" + propOperation,
		(project, args) => project.updateProjectPropertyAndSave(operation, args[0], _.rest(args, 1)));
});
helpers.registerCommand("project", "prop|print", (project, args) => project.printProjectProperty(args[0]));
