///<reference path=".d.ts"/>
"use strict";

import os = require("os");
import path = require("path");
import util = require("util");

import commonHelpers = require("./common/helpers");
import Future = require("fibers/future");
import helpers = require("./helpers");
import options = require("./common/options");
import projectPropertiesServiceLib = require("./services/project-properties-service");

export class Project implements Project.IProject {
	private static JSON_PROJECT_FILE_NAME_REGEX = "[.]abproject";
	private static CHUNK_UPLOAD_MIN_FILE_SIZE = 1024 * 1024 * 50;
	private static CONFIGURATION_FILE_SEARCH_PATTERN: RegExp = new RegExp(".*.abproject$", "i");
	private static VALID_CONFIGURATION_CHARACTERS_REGEX = "[-_A-Za-z0-9]";
	private static CONFIGURATION_FROM_FILE_NAME_REGEX = new RegExp("^[.](" + Project.VALID_CONFIGURATION_CHARACTERS_REGEX + "+?)" + Project.JSON_PROJECT_FILE_NAME_REGEX + "$", "i");
	private static INDENTATION = "     ";

	private _hasBuildConfigurations: boolean = false;
	private _projectSchema: any;
	private cachedProjectDir: string = "";

	private frameworkProject: Project.IFrameworkProject;
	public projectData: IProjectData;
	public configurationSpecificData: IDictionary<IDictionary<any>>;

	constructor(private $config: IConfiguration,
		private $errors: IErrors,
		private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $fs: IFileSystem,
		private $jsonSchemaValidator: IJsonSchemaValidator,
		private $loginManager: ILoginManager,
		private $logger: ILogger,
		private $multipartUploadService: IMultipartUploadService,
		private $progressIndicator: IProgressIndicator,
		private $projectConstants: Project.IProjectConstants,
		private $projectFilesManager: Project.IProjectFilesManager,
		private $projectPropertiesService: IProjectPropertiesService,
		private $server: Server.IServer,
		private $staticConfig: IStaticConfig,
		private $templatesService: ITemplatesService) {

		this.configurationSpecificData = Object.create(null);
		this.readProjectData().wait();

		if(this.projectData && this.projectData["TemplateAppName"]) {
			this.$errors.failWithoutHelp("This hybrid project targets Apache Cordova 2.x. " +
					"The AppBuilder CLI lets you target only Apache Cordova 3.0.0 or later. " +
					"To develop your projects with Apache Cordova 2.x, run the AppBuilder Windows client or the in-browser client.");
		}
	}

	public get capabilities(): IProjectCapabilities {
		return this.frameworkProject.capabilities;
	}

	public getLiveSyncUrl(): string {
		return this.frameworkProject.liveSyncUrl;
	}

	public get projectConfigFiles(): Project.IConfigurationFile[] {
		return this.frameworkProject.configFiles;
	}

	public get startPackageActivity(): string {
		return this.frameworkProject.startPackageActivity;
	}

	public getProjectTargets(): IFuture<string[]> {
		return (() => {
			let projectDir = this.getProjectDir().wait();
			let projectTargets = this.frameworkProject.getProjectTargets(projectDir).wait();
			return projectTargets;
		}).future<string[]>()();
	}

	public getConfigFileContent(template: string): IFuture<any> {
		return (() => {
			let configFile = _.find(this.projectConfigFiles, configFile => configFile.template === template);
			if(configFile) {
				try {
					let configFileContent = this.$fs.readText(configFile.filepath).wait();
					return configFileContent;
				} catch(e) {
					return null;
				}
			}

			return null;
		}).future<any>()();
	}

	public configurationFilesString(): string {
		if(!this.frameworkProject) {
			let result: string[] = [];

			_.each(_.values(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS), (framework: string) => {
				let frameworkProject = this.$frameworkProjectResolver.resolve(framework);
				let configFiles = frameworkProject.configFiles;
				if(configFiles && configFiles.length > 0) {
					let title = util.format("Configuration files for %s projects:", framework);
					result.push(title);
					result.push(this.configurationFilesStringCore(configFiles));
				}
			});

			return result.join("\n")
		}

		return this.configurationFilesStringCore(this.frameworkProject.configFiles);
	}

	private configurationFilesStringCore(configFiles: Project.IConfigurationFile[]) {
		return _.map(configFiles, (file) => {
			return util.format("        %s - %s", file.template, file.helpText);
		}).join("\n");
	}

	public get configurations(): string[] {
		let configurations: string[] = [];
		if(options.debug || options.d) {
			configurations.push(this.$projectConstants.DEBUG_CONFIGURATION_NAME);
		}

		if(options.release || options.r) {
			configurations.push(this.$projectConstants.RELEASE_CONFIGURATION_NAME);
		}

		if(configurations.length === 0) {
			configurations.push(this.$projectConstants.DEBUG_CONFIGURATION_NAME);
			configurations.push(this.$projectConstants.RELEASE_CONFIGURATION_NAME);
		}

		return configurations;
	}

	public hasBuildConfigurations(): boolean {
		return this._hasBuildConfigurations;
	}

	public getBuildConfiguration(): string {
		let configuration = options.release || options.r ? this.$projectConstants.RELEASE_CONFIGURATION_NAME : this.$projectConstants.DEBUG_CONFIGURATION_NAME;
		return configuration.charAt(0).toUpperCase() + configuration.slice(1);
	}

	public getProperty(propertyName: string, configuration: string): any {
		return (<any>this.frameworkProject).getProperty(propertyName, configuration, this.projectInformation);
	}

	public setProperty(propertyName: string, value: any, configuration: string): void {
		if(this._hasBuildConfigurations) {
			let configData = this.configurationSpecificData[configuration];
			if (!configData) {
				configData = Object.create(null);
				this.configurationSpecificData[configuration] = configData;
			}

			configData[propertyName] = value;
		} else {
			this.projectData[propertyName] = value;
		}
	}

	public getProjectDir(): IFuture<string> {
		return (() => {
			if(this.cachedProjectDir !== "") {
				return this.cachedProjectDir;
			}
			this.cachedProjectDir = null;

			let projectDir = path.resolve(options.path || ".");
			while(true) {
				this.$logger.trace("Looking for project in '%s'", projectDir);

				if(this.$fs.exists(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME)).wait()) {
					this.$logger.debug("Project directory is '%s'.", projectDir);
					this.cachedProjectDir = projectDir;
					break;
				}

				let dir = path.dirname(projectDir);
				if(dir === projectDir) {
					this.$logger.debug("No project found at or above '%s'.", path.resolve("."));
					break;
				}
				projectDir = dir;
			}

			return this.cachedProjectDir;
		}).future<string>()();
	}

	public createTemplateFolder(projectDir: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(projectDir).wait();
			let projectDirFiles = this.$fs.readDirectory(projectDir).wait();

			if(projectDirFiles.length !== 0) {
				this.$errors.fail("The specified directory '%s' must be empty to create a new project.", projectDir);
			}
		}).future<void>()();
	}

	public createProjectFile(projectDir: string, properties: any): IFuture<void> {
		return ((): void => {
			properties = properties || {};

			this.$fs.createDirectory(projectDir).wait();
			this.cachedProjectDir = projectDir;
			this.projectData = properties;
			this.frameworkProject = this.$frameworkProjectResolver.resolve(this.projectData.Framework);

			this.$projectPropertiesService.completeProjectProperties(this.projectData, this.frameworkProject);

			this.validateProjectData(this.projectData);
			this.saveProject(projectDir).wait();
		}).future<void>()();
	}

	public createNewProject(projectName: string, framework: string): IFuture<void> {
		if(!projectName) {
			this.$errors.fail("No project name specified.")
		}

		let projectDir = this.getNewProjectDir();
		this.frameworkProject = this.$frameworkProjectResolver.resolve(framework);
		return this.createFromTemplate(projectName, projectDir);
	}

	public initializeProjectFromExistingFiles(framework: string, projectDir?: string, appName?: string): IFuture<void> {
		return ((): void => {
			projectDir = projectDir || this.getNewProjectDir();

			if(!this.$fs.exists(projectDir).wait()) {
				this.$errors.fail({ formatStr: util.format("The specified folder '%s' does not exist!", projectDir), suppressCommandHelp: true });
			}

			let projectFile = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
			if(this.$fs.exists(projectFile).wait()) {
				this.$errors.fail({ formatStr: "The specified folder is already an AppBuilder command line project!", suppressCommandHelp: true });
			}

			this.frameworkProject = this.$frameworkProjectResolver.resolve(framework);
			let blankTemplateFile = this.frameworkProject.getTemplateFilename("Blank");
			this.$fs.unzip(path.join(this.$templatesService.projectTemplatesDir, blankTemplateFile), projectDir, { overwriteExisitingFiles: false }, ["*.abproject", ".abignore"]).wait();

			this.createProjectFileFromExistingProject(projectDir, appName).wait();
			this.$logger.info("Successfully initialized %s project.", framework); 
		}).future<void>()();
	}

	private createProjectFileFromExistingProject(projectDir: string, appName?: string): IFuture<void> {
		return ((): void => {
			appName = appName || path.basename(projectDir);

			let properties = this.getProjectPropertiesFromExistingProject(projectDir, appName).wait();
			this.projectData = this.alterPropertiesForNewProject(properties, appName);

			try {
				this.validateProjectData(this.projectData);
				this.saveProject(projectDir).wait();
			}
			catch(e) {
				this.$errors.fail("There was an error while initialising the project: " + os.EOL + e);
			}
		}).future<void>()();
	}

	public getNewProjectDir() {
		return options.path || process.cwd();
	}

	public ensureProject(): void {
		if(!this.projectData) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}
	}

	public ensureCordovaProject() {
		this.ensureProject();

		if(this.projectData.Framework !== this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova) {
			this.$errors.fail("This command is applicable only to Cordova projects.");
		}
	}

	public enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]> {
		return (() => {
			let projectDir = this.getProjectDir().wait();
			let projectFiles = this.$projectFilesManager.enumerateProjectFiles(projectDir, additionalExcludedProjectDirsAndFiles).wait();
			return projectFiles;
		}).future<string[]>()();
	}

	public getTempDir(extraSubdir?: string): IFuture<string> {
		return (() => {
			let dir = path.join(this.getProjectDir().wait(), ".ab");
			this.$fs.createDirectory(dir).wait();
			if(extraSubdir) {
				dir = path.join(dir, extraSubdir);
				this.$fs.createDirectory(dir).wait();
			}
			return dir;
		}).future<string>()();
	}

	public updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void> {
		return (() => {
			this.ensureProject();

			if(propertyName === this.$projectConstants.APPIDENTIFIER_PROPERTY_NAME) {
				this.$jsonSchemaValidator.validatePropertyUsingBuildSchema(propertyName, propertyValues[0]);
			}

			this.$projectPropertiesService.updateProjectProperty(this.projectData, mode, propertyName, propertyValues).wait();
			this.printProjectProperty(propertyName).wait();
			this.saveProject(this.getProjectDir().wait()).wait();
		}).future<void>()();
	}

	public printProjectProperty(property: string): IFuture<void> {
		return (() => {
			if(this.projectData) {
				let schema: any = this.getProjectSchema().wait();

				if(property) {
					let normalizedPropertyName = this.$projectPropertiesService.normalizePropertyName(property, this.projectData);

					if(options.validValue) {
						// '$ appbuilder prop print <PropName> --validValue' called inside project dir
						let prop: any = schema[normalizedPropertyName];
						this.printValidValuesOfProperty(prop).wait();
					} else {
						// '$ appbuilder prop print <PropName>' called inside project dir
						if(_.has(this.projectData, normalizedPropertyName)) {
							this.$logger.out(this.projectData[normalizedPropertyName]);
						} else if(this.hasConfigurationSpecificDataForProperty(normalizedPropertyName)) {
							this.printConfigurationSpecificDataForProperty(normalizedPropertyName);
						} else {
							this.$errors.fail("Unrecognized project property '%s'", property);
						}
					}
				} else {
					if(options.validValue) {
						// 'appbuilder prop print --validValue' called inside project dir
						let propKeys: any = _.keys(schema);
						let sortedProperties = _.sortBy(propKeys, (propertyName: string) => propertyName.toUpperCase());
						_.each(sortedProperties, propKey => {
							let prop = schema[propKey];
							this.$logger.info("  " + propKey);
							this.printValidValuesOfProperty(prop).wait();
						});
					} else {
						// 'appbuilder prop print' called inside project dir
						let propKeys: any = _.keys(this.projectData);
						let sortedProperties = _.sortBy(propKeys, (propertyName: string) => propertyName.toUpperCase());
						_.each(sortedProperties, (propertyName: string) => this.$logger.out(propertyName + ": " + this.projectData[propertyName]));
						this.printConfigurationSpecificData();
					}
				}
			} else {
				// We'll get here only when command is called outside of project directory and --validValue is specified
				if(property) {
					let targetFrameworkIdentifiers = _.values(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS);
					_.each(targetFrameworkIdentifiers, (targetFrameworkIdentifier: string) => {
						let projectSchema: IDictionary<any> = this.$jsonSchemaValidator.tryResolveValidationSchema(targetFrameworkIdentifier);
						let currentProp = _.find(_.keys(projectSchema), key => key === property);
						if(currentProp) {
							this.$logger.out("  Project type %s:", targetFrameworkIdentifier);
							this.printValidValuesOfProperty(projectSchema[currentProp]).wait();
						}
					});
				} else {
					this.$logger.out(this.$projectPropertiesService.getPropertiesForAllSupportedProjects().wait());
				}
			}
		}).future<void>()();
	}

	private printValidValuesOfProperty(property: any): IFuture<void> {
		return (() => {
			if(property.description) {
				this.$logger.info("%s%s", Project.INDENTATION, property.description);
			}

			if(property.pattern) {
				this.$logger.trace("%sDesired pattern is: %s", Project.INDENTATION, property.pattern);
			}

			let validValues: string[] = this.$projectPropertiesService.getValidValuesForProperty(property).wait();
			if(validValues) {
				this.$logger.out("%sValid values:", Project.INDENTATION);
				_.forEach(validValues, value => {
					this.$logger.out("%s  %s", Project.INDENTATION, value);
				});
			}
		}).future<void>()();
	}

	private hasConfigurationSpecificDataForProperty(normalizedPropertyName: string): boolean {
		let properties = _(this.configurationSpecificData)
			.values()
			.map(val => _.keys(val))
			.flatten()
			.value();
		return _.some(properties, prop => prop === normalizedPropertyName);
	}

	private getPropertyValueAsArray(property: any, indentation: string): any {
		if (typeof property === "string" || property instanceof Array) {
			return [property];
		}

		return _.map(property,  (value, key) => {
			// use '\n' not os.EOL as cli-table does not handle \r\n very well
			let delimiter = typeof value === "string" || value instanceof Array ? " " : '\n';
			return util.format('%s%s:%s%s', indentation, key, delimiter, this.getPropertyValueAsArray(value, indentation + '   ').join('\n'));
		});
	}

	private getConfigurationSpecificDataForProperty(normalizedPropertyName: string): any[] {
		let numberOfConfigs = _.keys(this.configurationSpecificData).length;
		let configsDataForProperty: any[] = _(this.configurationSpecificData)
			.values()
			.map(config => _.flatten(this.getPropertyValueAsArray(config[normalizedPropertyName], '')))
			.value();

		let sharedValues: string[] = _.intersection.apply(null, configsDataForProperty);
		let valuesInAllConfigs = _.map(sharedValues, value => helpers.fill(value, numberOfConfigs));
		let configSpecificValues = _.map(configsDataForProperty, config => _.difference(config, sharedValues));

		let maxLength = _(configSpecificValues)
			.values()
			.map(value => value.length)
			.max();

		_.range(maxLength)
			.map(valueIndex => _.map(configSpecificValues, config => config[valueIndex] || ""))
			.forEach(propertyValues => valuesInAllConfigs.push(propertyValues));

		return valuesInAllConfigs;
	}

	private printConfigurationSpecificData(): void {
		let properties = <string[]>_(this.configurationSpecificData)
			.values()
			.map(properties => _.keys(properties))
			.flatten()
			.uniq()
			.value();

		if(properties.length > 0) {
			this.$logger.out("%sConfiguration specific properties: ", os.EOL);
			_.forEach(properties, property => this.printConfigurationSpecificDataForProperty(property));
		}
	}

	private printConfigurationSpecificDataForProperty(property: string): void {
		let data = this.getConfigurationSpecificDataForProperty(property);
		let headers = _.keys(this.configurationSpecificData);
		let table = commonHelpers.createTable(headers, data);
		this.$logger.out("%s:%s%s", property, os.EOL, table.toString());
	}

	public validateProjectProperty(property: string, args: string[], mode: string): IFuture<boolean> {
		return (() => {
			let validProperties = this.$jsonSchemaValidator.getValidProperties(this.projectData.Framework, this.projectData.FrameworkVersion);
			if(_.contains(validProperties, property)) {
				let normalizedPropertyName =  this.$projectPropertiesService.normalizePropertyName(property, this.projectData);
				let isArray = this.$jsonSchemaValidator.getPropertyType(this.projectData.Framework, normalizedPropertyName) === "array";
				if(!isArray) {
					if(!args || args.length === 0 ) {
						this.$errors.fail("Property %s requires a single value.", property);
					}
					if(args.length !== 1) {
						this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
					}

					if(mode === "add" || mode === "del") {
						this.$errors.fail("Property '%s' is not a collection of flags. Use prop-set to set a property value.", property);
					}
				}

				return true;
			}

			this.$errors.fail("Invalid property name '%s'.", property);
		}).future<boolean>()();
	}

	public getProjectSchema(): IFuture<any> {
		return (() => {
			if(!this._projectSchema) {
				this._projectSchema = this.frameworkProject.getProjectFileSchema();
			}

			return this._projectSchema;
		}).future<any>()();
	}

	public adjustBuildProperties(buildProperties: any): any {
		return this.frameworkProject.adjustBuildProperties(buildProperties, this.projectInformation);
	}

	public get requiredAndroidApiLevel(): number {
		return this.frameworkProject.requiredAndroidApiLevel;
	}

	public ensureAllPlatformAssets(): IFuture<void> {
		return (() => {
			let projectDir = this.getProjectDir().wait();
			this.frameworkProject.ensureAllPlatformAssets(projectDir, this.projectData.FrameworkVersion).wait();
		}).future<void>()();
	}

	private validateProjectData(properties: any): void {
		this.$jsonSchemaValidator.validate(properties);
		if (this.capabilities.build) {
			this.$jsonSchemaValidator.validatePropertyUsingBuildSchema(this.$projectConstants.APPIDENTIFIER_PROPERTY_NAME, properties.AppIdentifier);
		}
	}

	public saveProject(projectDir: string, configurations?: string[]): IFuture<void> {
		return (() => {
			let configs = (configurations && configurations.length > 0) ? configurations : this.configurations;
			projectDir = projectDir || this.getProjectDir().wait();
			this.$fs.writeJson(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME), this.projectData).wait();

			_.each(configs, (configuration: string) => {
				let configFilePath = path.join(projectDir, util.format(".%s%s", configuration, this.$projectConstants.PROJECT_FILE));

				if(this.$fs.exists(configFilePath).wait() && this.configurationSpecificData[configuration]) {
					this.$fs.writeJson(configFilePath, this.configurationSpecificData[configuration]).wait();
				}
			});
		}).future<void>()();
	}

	public zipProject(): IFuture<string> {
		return (() => {
			let tempDir = this.getTempDir().wait();

			let projectZipFile = path.join(tempDir, "Build.zip");
			this.$fs.deleteFile(projectZipFile).wait();
			let projectDir = this.getProjectDir().wait();

			let files = this.enumerateProjectFiles().wait();
			let zipOp = this.$fs.zipFiles(projectZipFile, files,
				p => this.getProjectRelativePath(p, projectDir));

			let result = new Future<string>();
			zipOp.resolveSuccess(() => result.return(projectZipFile));
			return result.wait();
		}).future<string>()();
	}

	public importProject(): IFuture<void> {
		return (() => {
			this.ensureProject();

			this.$loginManager.ensureLoggedIn().wait();
			let projectZipFile = this.zipProject().wait();
			let fileSize = this.$fs.getFileSize(projectZipFile).wait();
			this.$logger.debug("zipping completed, result file size: %s", fileSize.toString());
			let projectName = this.projectData.ProjectName;
			let bucketKey = util.format("%s_%s", projectName, path.basename(projectZipFile));
			this.$logger.printInfoMessageOnSameLine("Uploading...");
			if(fileSize > Project.CHUNK_UPLOAD_MIN_FILE_SIZE) {
				this.$logger.trace("Start uploading file by chunks.");
				this.$progressIndicator.showProgressIndicator(this.$multipartUploadService.uploadFileByChunks(projectZipFile, bucketKey), 2000).wait();
				this.$progressIndicator.showProgressIndicator(this.$server.projects.importLocalProject(projectName, projectName, bucketKey), 2000).wait();
			} else {
				this.$progressIndicator.showProgressIndicator(this.$server.projects.importProject(projectName, projectName,
					this.$fs.createReadStream(projectZipFile)), 2000).wait();
			}

			this.$logger.printInfoMessageOnSameLine(os.EOL);
			this.$logger.trace("Project imported");
		}).future<void>()();
	}

	private getProjectRelativePath(fullPath: string, projectDir: string): string {
		projectDir = path.join(projectDir, path.sep);
		if (!_.startsWith(fullPath, projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	private get projectInformation(): Project.IProjectInformation {
		return {
			projectData: this.projectData,
			configurationSpecificData: this.configurationSpecificData,
			hasBuildConfigurations: this._hasBuildConfigurations
		}
	}

	private readProjectData(): IFuture<void> {
		return (() => {
			let projectDir = this.getProjectDir().wait();
			let shouldSaveProject = false;
			if(projectDir) {
				let projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
				try {
					let data = this.$fs.readJson(projectFilePath).wait();
					if(data.projectVersion && data.projectVersion.toString() !== "1") {
						this.$errors.fail("FUTURE_PROJECT_VER");
					}

					if(!_.has(data, "Framework")) {
						if(_.has(data, "projectType")) {
							data["Framework"] = data["projectType"];
							delete data["projectType"];
						} else {
							data["Framework"] = this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova;
						}

						shouldSaveProject = true;
					}

					this.projectData = data;
					this.frameworkProject = this.$frameworkProjectResolver.resolve(this.projectData.Framework);
					shouldSaveProject = this.$projectPropertiesService.completeProjectProperties(this.projectData, this.frameworkProject) || shouldSaveProject;
					
					if(this.$staticConfig.triggerJsonSchemaValidation) {
						this.$jsonSchemaValidator.validate(this.projectData);
					}

					let debugProjectFile = path.join(projectDir, this.$projectConstants.DEBUG_PROJECT_FILE_NAME);
					if(options.debug && !this.$fs.exists(debugProjectFile).wait()) {
						this.$fs.writeJson(debugProjectFile, {}).wait();
					}

					let releaseProjectFile = path.join(projectDir, this.$projectConstants.RELEASE_PROJECT_FILE_NAME);
					if(options.release && !this.$fs.exists(releaseProjectFile).wait()) {
						this.$fs.writeJson(releaseProjectFile, {}).wait();
					}

					let allProjectFiles = this.$fs.enumerateFilesInDirectorySync(projectDir, (file: string, stat: IFsStats) => {
						return Project.CONFIGURATION_FILE_SEARCH_PATTERN.test(file);
					});

					_.each(allProjectFiles, (configProjectFile: string) => {
						let configMatch = path.basename(configProjectFile).match(Project.CONFIGURATION_FROM_FILE_NAME_REGEX);
						if(configMatch && configMatch.length > 1) {
							let configurationName = configMatch[1];
							let configProjectContent = this.$fs.readJson(configProjectFile).wait();
							this.configurationSpecificData[configurationName.toLowerCase()] = configProjectContent;
							this._hasBuildConfigurations = true;
						}
					});
				} catch(err) {
					if(err === "FUTURE_PROJECT_VER") {
						this.$errors.fail({
							formatStr: "This project is created by a newer version of AppBuilder. Upgrade AppBuilder CLI to work with it.",
							suppressCommandHelp: true
						});
					}
					this.$errors.fail({
						formatStr: "The project file %s is corrupted." + os.EOL +
						"Consider restoring an earlier version from your source control or backup." + os.EOL +
						"To create a new one with the default settings, delete this file and run $ appbuilder init hybrid." + os.EOL +
						"Additional technical information: %s",
						suppressCommandHelp: true
					},
						projectFilePath, err.toString());
				}

				if(shouldSaveProject && this.$config.AUTO_UPGRADE_PROJECT_FILE) {
					this.saveProject(projectDir).wait();
				}
			}
		}).future<void>()();
	}

	private createFromTemplate(appname: string, projectDir: string): IFuture<void> {
		return (() => {
			let templatesDir = this.$templatesService.projectTemplatesDir;
			let template = options.template || this.frameworkProject.defaultProjectTemplate;
			let templateFileName = path.join(templatesDir, this.frameworkProject.getTemplateFilename(template));

			this.$logger.trace("Using template '%s'", templateFileName);
			if(this.$fs.exists(templateFileName).wait()) {
				projectDir = (options.path) ? projectDir : path.join(projectDir, appname);
				this.$logger.trace("Creating template folder '%s'", projectDir);
				this.createTemplateFolder(projectDir).wait();
				try {
					this.$logger.trace("Extracting template from '%s'", templateFileName);
					this.$fs.unzip(templateFileName, projectDir, { caseSensitive: false }).wait();
					this.$logger.trace("Reading template project properties.");

					let properties = this.$projectPropertiesService.getProjectProperties(path.join(projectDir, this.$projectConstants.PROJECT_FILE), true, this.frameworkProject).wait();
					properties = this.alterPropertiesForNewProject(properties, appname);
					this.$logger.trace(properties);
					this.$logger.trace("Saving project file.");
					this.createProjectFile(projectDir, properties).wait();
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
				let templates = this.frameworkProject.projectTemplatesString().wait();

				let message = util.format("The specified template %s does not exist. You can use any of the following templates: %s",
					options.template,
					os.EOL,
					templates);
				this.$errors.fail({ formatStr: message, suppressCommandHelp: true });
			}
		}).future<void>()();
	}

	private alterPropertiesForNewProject(properties: any, projectName: string): IProjectData {
		properties.ProjectGuid = commonHelpers.createGUID();
		properties.ProjectName = projectName;

		this.frameworkProject.alterPropertiesForNewProject(properties, projectName);

		return properties;
	}

	private removeExtraFiles(projectDir: string): IFuture<void> {
		return ((): void => {
			_.each(["mobile.vstemplate"],
				(file) => this.$fs.deleteFile(path.join(projectDir, file)).wait());
		}).future<void>()();
	}

	private getProjectPropertiesFromExistingProject(projectDir: string, appname: string): IFuture<IProjectData> {
		return ((): any => {
			let projectFile = _.find(this.$fs.readDirectory(projectDir).wait(), file => {
				let extension = path.extname(file);
				return extension == ".proj" || extension == ".iceproj" || file === this.$projectConstants.PROJECT_FILE;
			});

			if(projectFile) {
				let isJsonProjectFile = projectFile === this.$projectConstants.PROJECT_FILE;
				return this.$projectPropertiesService.getProjectProperties(path.join(projectDir, projectFile), isJsonProjectFile, this.frameworkProject).wait();
			}

			this.$logger.warn("No AppBuilder project file found in folder. Creating project with default settings!");
			return null;
		}).future<IProjectData>()();
	}
}
$injector.register("project", Project);
