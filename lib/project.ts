///<reference path=".d.ts"/>

"use strict";

import xml2js = require("xml2js");
import minimatch = require("minimatch");
import path = require("path");
var options:any = require("./options");
import util = require("util");
import Future = require("fibers/future");
import helpers = require("./helpers");
import os = require("os");
import MobileHelper = require("./mobile/mobile-helper");

export class Project implements Project.IProject {
	private cachedProjectDir: string = "";
	public projectData: IProjectData;

	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $projectNameValidator,
		private $errors: IErrors,
		private $userDataStore: IUserDataStore,
		private $loginManager: ILoginManager,
		private $resources: IResourceLoader,
		private $templatesService: ITemplatesService,
		private $pathFilteringService : IPathFilteringService) {
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

	private static IGNORE_FILE = ".abignore";
	private static INTERNAL_NONPROJECT_FILES = [".ab", ".abproject", Project.IGNORE_FILE, "*.ipa", "*.apk", "*.xap"];

	public enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): string[] {
		var excludedProjectDirsAndFiles = Project.INTERNAL_NONPROJECT_FILES.
			concat(additionalExcludedProjectDirsAndFiles || []);

		var projectDir = this.getProjectDir();
		var projectFiles = helpers.enumerateFilesInDirectorySync(projectDir, (filePath) => {
			return !this.isFileExcluded(path.relative(projectDir, filePath), excludedProjectDirsAndFiles);
		});

		var ignoreFilesRules = this.$pathFilteringService.getRulesFromFile(path.join(this.getProjectDir(), Project.IGNORE_FILE));

		projectFiles = this.$pathFilteringService.filterIgnoredFiles(projectFiles, ignoreFilesRules);

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

	public saveProject(projectDir: string): IFuture<void> {
		return this.$fs.writeJson(path.join(projectDir, this.$config.PROJECT_FILE_NAME), this.projectData, "\t");
	}

	private readProjectData(): IFuture<void> {
		return (() => {
			var projectDir = this.getProjectDir();
			if (projectDir) {
				this.projectData = this.$fs.readJson(path.join(projectDir, this.$config.PROJECT_FILE_NAME)).wait();

				if (this.completeProjectProperties(this.projectData) && this.$config.AUTO_UPGRADE_PROJECT_FILE) {
					this.saveProject(projectDir).wait();
				}
			}
		}).future<void>()();
	}

	public createNewProject(projectName: string): IFuture<void> {
		return ((): void => {
			if (!projectName) {
				this.$errors.fail("No project name specified.")
			}

			var projectDir = this.getNewProjectDir();
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

	private createFromTemplate(appname, projectDir): IFuture<void> {
		return (() => {
			var templatesDir = this.$templatesService.projectTemplatesDir,
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
			templateFileName = path.join(templatesDir, this.$templatesService.getTemplateFilename(template));
			this.$logger.trace("Using template '%s'", templateFileName);
			if (this.$fs.exists(templateFileName).wait()) {
				this.$logger.trace("Creating template folder '%s'", projectDir);
				this.createTemplateFolder(projectDir).wait();
				try {
					this.$logger.trace("Extracting template from '%s'", templateFileName);
					this.$fs.unzip(templateFileName, projectDir).wait();
					this.$logger.trace("Reading template project properties.");
					var properties = this.getProjectProperties(path.join(projectDir, "mobile.proj"), appname).wait();
					properties = this.alterPropertiesForNewProject(properties, appname);
					this.$logger.trace(properties);
					this.$logger.trace("Creating project file.");
					this.createProjectFile(projectDir, appname, properties).wait();
					this.$logger.trace("Removing unnecessary files from template.");
					this.removeExtraFiles(projectDir).wait();

					this.$logger.info("Project '%s' has been successfully created in '%s'.", appname, projectDir);
				}
				catch (ex) {
					this.$fs.deleteDirectory(projectDir).wait();
					throw ex;
				}
			} else {
				var message = util.format("The requested template %s does not exist.%sAvailable templates are: %s", options.template, os.EOL, this.$templatesService.projectTemplatesString());
				this.$errors.fail({formatStr: message, suppressCommandHelp: true});
			}
		}).future<void>()();
	}

	private removeExtraFiles(projectDir: string): IFuture<void> {
		return ((): void => {
			_.each(["mobile.proj", "mobile.vstemplate"],
				(file) => this.$fs.deleteFile(path.join(projectDir, file)).wait());
		}).future<void>()();
	}

	private getProjectProperties(projectFile: string, appName: string): IFuture<any> {
		return ((): any => {
			var properties: any = {};

			var parser = new xml2js.Parser();
			var contents = this.$fs.readText(projectFile).wait();

			var parseString = Future.wrap(function (str, callback) {
				return parser.parseString(str, callback);
			});

			var result: any = parseString(contents).wait();
			var propertyGroup: any = result.Project.PropertyGroup[0];

			var projectSchema = helpers.getProjectFileSchema();
			Object.keys(projectSchema).forEach((propertyName) => {
				if (propertyGroup.hasOwnProperty(propertyName)) {
					properties[propertyName] = propertyGroup[propertyName][0];
				}
			});

			properties.name = propertyGroup.ProjectName[0];

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

			this.completeProjectProperties(this.projectData);

			this.saveProject(projectDir).wait();
		}).future<void>()();
	}

	private completeProjectProperties(properties: any): boolean {
		var updated = false;

		if (properties.hasOwnProperty("iOSDisplayName")) {
			properties.DisplayName = properties.iOSDisplayName;
			delete properties.iOSDisplayName;
			updated = true;
		}
		if (!properties.DisplayName) {
			properties.DisplayName = properties.name;
			updated = true;
		}

		["WP8PublisherID", "WP8ProductID"].forEach((wp8guid) => {
			if (!properties.hasOwnProperty(wp8guid)) {
				properties[wp8guid] = MobileHelper.generateWP8GUID();
				updated = true;
			}
		});

		var defaultProject = this.$resources.readJson("default-project.json").wait();
		Object.keys(defaultProject).forEach((propName) => {
			if (!properties.hasOwnProperty(propName)) {
				properties[propName] = defaultProject[propName];
				updated = true;
			}
		});

		return updated;
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

	private normalizePropertyName(property: string): string {
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
			this.$errors.fail("Unrecognized project property '%s'", property);
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
