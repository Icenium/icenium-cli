import {EOL} from "os";
import * as path from "path";
import * as util from "util";
import * as commonHelpers from "./common/helpers";
import {Configurations} from "./common/constants";
import {ProjectBase} from "./common/appbuilder/project/project-base";
import Future = require("fibers/future");
import * as helpers from "./helpers";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "./common/constants";

export class Project extends ProjectBase implements Project.IProject {
	private static CHUNK_UPLOAD_MIN_FILE_SIZE = 1024 * 1024 * 50;
	private static INDENTATION = "     ";
	private static UI_TEMPLATE_NAMES: IStringDictionary = {
		"kendoui.blank": "KendoUI.Empty",
		"javascript.blank": "Blank"
	};

	private _projectSchema: any;
	private cachedProjectDir: string = "";
	private frameworkProject: Project.IFrameworkProject;

	constructor(private $config: IConfiguration,
		private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $ionicProjectTransformator: IIonicProjectTransformator,
		private $jsonSchemaValidator: IJsonSchemaValidator,
		private $loginManager: ILoginManager,
		private $multipartUploadService: IMultipartUploadService,
		private $progressIndicator: IProgressIndicator,
		private $projectFilesManager: IProjectFilesManager,
		private $projectPropertiesService: IProjectPropertiesService,
		private $server: Server.IServer,
		private $templatesService: ITemplatesService,
		private $prompter: IPrompter,
		protected $cordovaProjectCapabilities: Project.ICapabilities,
		protected $errors: IErrors,
		protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $nativeScriptProjectCapabilities: Project.ICapabilities,
		protected $options: IOptions,
		protected $projectConstants: Project.IConstants,
		protected $staticConfig: IStaticConfig) {
		super($cordovaProjectCapabilities, $errors, $fs, $logger, $nativeScriptProjectCapabilities, $options, $projectConstants, $staticConfig);

		if (this.projectData && this.projectData["TemplateAppName"]) {
			this.$errors.failWithoutHelp("This hybrid project targets Apache Cordova 2.x. " +
				"The AppBuilder CLI lets you target only Apache Cordova 3.0.0 or later. " +
				"To develop your projects with Apache Cordova 2.x, run the AppBuilder Windows client or the in-browser client.");
		}

		if (this.projectData && this.projectData.Framework) {
			this.frameworkProject = this.$frameworkProjectResolver.resolve(this.projectData.Framework);
			this.frameworkProject.updateMigrationConfigFile().wait();
		}
	}

	public get projectDir(): string {
		return this.getProjectDir();
	}

	public get capabilities(): Project.ICapabilities {
		return this.frameworkProject.capabilities;
	}

	public getLiveSyncUrl(): string {
		return this.frameworkProject.liveSyncUrl;
	}

	public get projectConfigFiles(): Project.IConfigurationFile[] {
		return this.frameworkProject.configFiles;
	}

	public get projectData(): Project.IData {
		if (!this._projectData) {
			this.readProjectData();
		}

		return this._projectData;
	}

	public set projectData(projectData: Project.IData) {
		this._projectData = projectData;
	}

	// overriden
	protected getShouldSaveProject(): boolean {
		this.frameworkProject = this.$frameworkProjectResolver.resolve(this.projectData.Framework);
		return this.$projectPropertiesService.completeProjectProperties(this.projectData, this.frameworkProject) || super.getShouldSaveProject();
	}

	public getPluginVariablesInfo(configuration?: string): IDictionary<IStringDictionary> {
		return this.frameworkProject.getPluginVariablesInfo(this.projectInformation, this.getProjectDir(), configuration);
	}

	public getProjectTargets(): string[] {
		let projectDir = this.getProjectDir();
		let projectTargets = this.frameworkProject.getProjectTargets(projectDir);
		return projectTargets;
	}

	public getConfigFileContent(template: string): any {
		let configFile = _.find(this.projectConfigFiles, _configFile => _configFile.template === template);

		if (configFile) {
			try {
				let configFileContent = this.$fs.readText(configFile.filepath);
				return configFileContent;
			} catch (e) {
				this.$logger.trace(`Error while trying to read file: ${configFile.filepath}. Error is: {e.message}.`);
				return null;
			}
		}

		return null;
	}

	public configurationFilesString(): string {
		if (!this.frameworkProject) {
			let result: string[] = [];

			_.each(_.values(TARGET_FRAMEWORK_IDENTIFIERS), (framework: string) => {
				let frameworkProject = this.$frameworkProjectResolver.resolve(framework);
				let configFiles = frameworkProject.configFiles;
				if (configFiles && configFiles.length > 0) {
					let title = util.format("Configuration files for %s projects:", framework);
					result.push(title);
					result.push(this.configurationFilesStringCore(configFiles));
				}
			});

			return result.join("\n");
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
		if (this.$options.debug) {
			configurations.push(this.$projectConstants.DEBUG_CONFIGURATION_NAME);
		}

		if (this.$options.release) {
			configurations.push(this.$projectConstants.RELEASE_CONFIGURATION_NAME);
		}

		if (configurations.length === 0) {
			configurations.push(this.$projectConstants.DEBUG_CONFIGURATION_NAME);
			configurations.push(this.$projectConstants.RELEASE_CONFIGURATION_NAME);
		}

		return configurations;
	}

	public getBuildConfiguration(): string {
		return this.$options.release ? Configurations.Release : Configurations.Debug;
	}

	public getProperty(propertyName: string, configuration: string): any {
		return (<any>this.frameworkProject).getProperty(propertyName, configuration, this.projectInformation);
	}

	public setProperty(propertyName: string, value: any, configuration: string): void {
		if (this.hasBuildConfigurations) {
			let configData = this.configurationSpecificData[configuration.toLowerCase()];
			if (!configData) {
				configData = Object.create(null);
				this.configurationSpecificData[configuration] = configData;
			}

			configData[propertyName] = value;
		} else {
			this.projectData[propertyName] = value;
		}
	}

	public getProjectDir(): string {
		if (this.cachedProjectDir) {
			return this.cachedProjectDir;
		}
		this.cachedProjectDir = null;

		let projectDir = path.resolve(this.$options.path || ".");
		while (true) {
			this.$logger.trace("Looking for project in '%s'", projectDir);

			if (this.$fs.exists(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME))) {
				this.$logger.debug("Project directory is '%s'.", projectDir);
				this.cachedProjectDir = projectDir;
				break;
			}

			let dir = path.dirname(projectDir);
			if (dir === projectDir) {
				this.$logger.debug("No project found at or above '%s'.", path.resolve("."));
				break;
			}
			projectDir = dir;
		}

		return this.cachedProjectDir;
	}

	public appResourcesPath(): string {
		return path.join(this.getProjectDir(), this.frameworkProject.relativeAppResourcesPath);
	}

	public createTemplateFolder(projectDir: string): void {
		this.$fs.createDirectory(projectDir);
		let projectDirFiles = this.$fs.readDirectory(projectDir);

		if (projectDirFiles.length !== 0) {
			this.$errors.fail("The specified directory '%s' must be empty to create a new project.", projectDir);
		}
	}

	// TODO: Remove IFuture, reason: writeJson
	public async createProjectFile(projectDir: string, properties: any): Promise<void> {
			properties = properties || {};

			this.$fs.createDirectory(projectDir);
			this.cachedProjectDir = projectDir;
			this.projectData = properties;
			this.frameworkProject = this.$frameworkProjectResolver.resolve(this.projectData.Framework);

			this.$projectPropertiesService.completeProjectProperties(this.projectData, this.frameworkProject);

			this.validateProjectData(this.projectData);
			this.saveProject(projectDir);
	}

	public createNewProject(projectName: string, framework: string, template?: string): IFuture<void> {
		if (!projectName) {
			this.$errors.fail("No project name specified.");
		}

		let projectDir = this.getNewProjectDir();
		this.frameworkProject = this.$frameworkProjectResolver.resolve(framework);
		return this.createFromTemplate(projectName, projectDir, template);
	}

	private get projectFilePatterns(): string[] {
		return [`*${this.$projectConstants.PROJECT_FILE}`, `*${this.$projectConstants.PROJECT_IGNORE_FILE}`];
	}

	public isIonicProject(projectDir: string): boolean {
		let result = false;
		let oldIonicProjectFile = path.join(projectDir, "ionic.project");
		let newIonicProjectFile = path.join(projectDir, "ionic.config.json");
		let ionicProject = this.$fs.exists(oldIonicProjectFile) ? oldIonicProjectFile : newIonicProjectFile;
		let packageJson = path.join(projectDir, "package.json");
		let hasIonicProject = this.$fs.exists(ionicProject);
		let hasPackageJson = this.$fs.exists(packageJson);
		if (hasIonicProject && hasPackageJson) {
			try {
				let content = this.$fs.readJson(ionicProject);
				result = _.has(content, "name") && _.has(content, "app_id");
			} catch (e) {
				// it is not valid Ionic project, leave the value of `result` as is
			}
		}

		return result;
	}

	public async initializeProjectFromExistingFiles(framework: string, projectDir?: string, appName?: string): Promise<void> {
			const prompt = "CAUTION: This operation will modify your Ionic-based project to make it compatible with AppBuilder and cannot be undone. To avoid losing any work, make sure that you have a backup or that the project is under source control.";

			projectDir = projectDir || this.getNewProjectDir();

			if (!this.$fs.exists(projectDir)) {
				this.$errors.failWithoutHelp(`The specified folder '${projectDir}' does not exist!`);
			}

			let ionicProject = this.isIonicProject(projectDir);
			let createBackupOfIonicProject: boolean = false;
			if (ionicProject && !this.$options.force) {
				this.$logger.warn(prompt);
				createBackupOfIonicProject = await  this.$prompter.confirm("Do you want to create backup folder?", () => true);
			}

			let projectFile = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
			if (this.$fs.exists(projectFile)) {
				this.$errors.failWithoutHelp("The specified folder is already an AppBuilder command line project!");
			}

			this.frameworkProject = this.$frameworkProjectResolver.resolve(framework);
			let blankTemplateFile = this.frameworkProject.getTemplateFilename("Blank");
			this.$fs.unzip(path.join(this.$templatesService.projectTemplatesDir, blankTemplateFile), projectDir, { overwriteExisitingFiles: false }, this.projectFilePatterns.concat(this.frameworkProject.projectSpecificFiles)).wait();

			this.createProjectFileFromExistingProject(projectDir, appName).wait();

			if (ionicProject) {
				this.$ionicProjectTransformator.transformToAppBuilderProject(createBackupOfIonicProject).wait();
			}

			this.$logger.info("Successfully initialized %s project.", framework);
	}

	private async createProjectFileFromExistingProject(projectDir: string, appName?: string): Promise<void> {
			appName = appName || path.basename(projectDir);

			let properties = await  this.getProjectPropertiesFromExistingProject(projectDir, appName);
			this.projectData = this.alterPropertiesForNewProject(properties, appName);

			try {
				this.validateProjectData(this.projectData);
				this.saveProject(projectDir);
			} catch (e) {
				this.$errors.fail("There was an error while initialising the project: " + EOL + e);
			}
	}

	public getNewProjectDir() {
		return this.$options.path || process.cwd();
	}

	public ensureProject(): void {
		if (!this.projectData) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}

		this.frameworkProject.ensureProject(this.projectDir).wait();
	}

	public ensureCordovaProject() {
		this.ensureProject();

		if (this.projectData.Framework !== TARGET_FRAMEWORK_IDENTIFIERS.Cordova) {
			this.$errors.fail("This command is applicable only to Cordova projects.");
		}
	}

	private enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): string[] {
		let projectDir = this.getProjectDir();

		let filter = (filePath: string, stat: IFsStats) => {
			let isSubprojectDir = stat.isDirectory() && this.$fs.exists(path.join(filePath, this.$projectConstants.PROJECT_FILE));
			return isSubprojectDir;
		};

		let projectFiles = this.$projectFilesManager.getProjectFiles(projectDir, additionalExcludedProjectDirsAndFiles, filter);

		return projectFiles;
	}

	public getTempDir(extraSubdir?: string): string {
		let dir = path.join(this.getProjectDir(), ".ab");
		this.$fs.createDirectory(dir);
		if (extraSubdir) {
			dir = path.join(dir, extraSubdir);
			this.$fs.createDirectory(dir);
		}
		return dir;
	}

	public getConfigurationsSpecifiedByUser(): string[] {
		let validConfigurations = this.getAllConfigurationsNames(),
			userConfigurations = _.map(this.$options.config, c => c.toLowerCase());
		if (this.$options.config && this.$options.config.length && !_.intersection(validConfigurations, userConfigurations).length) {
			this.$errors.failWithoutHelp("Operation cannot be completed because configurations %s are invalid.", this.$options.config);
		}

		return userConfigurations.filter(c => {
			let configName = c.toLowerCase();
			if (~validConfigurations.indexOf(configName)) {
				return true;
			}

			this.$logger.warn("Configuration %s is invalid", c);
			return false;
		});
	}

	public getAllConfigurationsNames(): string[] {
		return _.keys(this.configurationSpecificData);
	}

	public getProjectConfiguration(defaultConfiguration?: string): string {
		let result = this.getConfigurationsSpecifiedByUser()[0];
		if (!result && defaultConfiguration) {
			result = _.some(this.getAllConfigurationsNames(), conf => conf.toLowerCase() === defaultConfiguration.toLowerCase()) ? defaultConfiguration : null;
		}

		return result || _.first(this.getAllConfigurationsNames().sort()) || Configurations.Debug;
	}

	public async updateProjectProperty(mode: string, propertyName: string, propertyValues: string[], configurations?: string[]): Promise<void> {
			let data = this.validateUpdatePropertyInfo(propertyName, propertyValues, configurations),
				normalizedPropertyName = data.normalizedPropertyName,
				projectConfigurations = data.projectConfigurations;

			if (normalizedPropertyName === this.$projectConstants.CORE_PLUGINS_PROPERTY_NAME) {
				this.$projectPropertiesService.updateCorePlugins(this.projectData, this.configurationSpecificData, mode, propertyValues, projectConfigurations).wait();
			} else {
				if (projectConfigurations.length) {
					_.each(projectConfigurations, configuration => {
						this.$projectPropertiesService.updateProjectProperty(this.projectData, this.configurationSpecificData[configuration], mode, normalizedPropertyName, propertyValues).wait();
					});
				} else {
					this.$projectPropertiesService.updateProjectProperty(this.projectData, undefined, mode, normalizedPropertyName, propertyValues).wait();
					_.each(this.configurationSpecificData, configData => await  this.$projectPropertiesService.updateProjectProperty(configData, undefined, mode, normalizedPropertyName, propertyValues));
				}
			}
	}

	public async updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[], configurations?: string[]): Promise<void> {
			let data = this.validateUpdatePropertyInfo(propertyName, propertyValues, configurations),
				normalizedPropertyName = data.normalizedPropertyName,
				projectConfigurations = data.projectConfigurations;

			this.updateProjectProperty(mode, normalizedPropertyName, propertyValues, projectConfigurations).wait();

			this.saveProject(this.getProjectDir(), this.getAllConfigurationsNames());
			projectConfigurations.forEach(configuration => {
				this.printProjectProperty(normalizedPropertyName, configuration).wait();
			});

			if (!projectConfigurations || !projectConfigurations.length) {
				this.printProjectProperty(normalizedPropertyName).wait();
			}
	}

	public async printProjectProperty(property: string, configuration?: string): Promise<void> {
			if (this.projectData) {
				let schema: any = await  this.getProjectSchema();
				let mergedProjectData = Object.create(null);
				_.extend(mergedProjectData, this.projectData);
				if (configuration) {
					_.extend(mergedProjectData, this.configurationSpecificData[configuration]);
				}

				if (property) {
					let normalizedPropertyName = this.$projectPropertiesService.normalizePropertyName(property, mergedProjectData);

					if (this.$options.validValue) {
						// '$ appbuilder prop print <PropName> --validValue' called inside project dir
						let prop: any = schema[normalizedPropertyName];
						this.printValidValuesOfProperty(prop).wait();
					} else {
						// '$ appbuilder prop print <PropName>' called inside project dir
						if (_.has(mergedProjectData, normalizedPropertyName)) {
							let additionalMessage = configuration ? ` for configuration ${configuration}` : "";
							this.$logger.write(`The value of ${normalizedPropertyName}${additionalMessage} is: `);
							this.$logger.out(mergedProjectData[normalizedPropertyName]);
						} else if (this.hasConfigurationSpecificDataForProperty(normalizedPropertyName)) {
							this.printConfigurationSpecificDataForProperty(normalizedPropertyName);
						} else {
							this.$errors.fail("Unrecognized project property '%s'", property);
						}
					}
				} else {
					if (this.$options.validValue) {
						// 'appbuilder prop print --validValue' called inside project dir
						let propKeys = _.keys(schema);
						let sortedProperties = _.sortBy(propKeys, (propertyName: string) => propertyName.toUpperCase());
						_.each(sortedProperties, propKey => {
							let prop = schema[propKey];
							this.$logger.info("  " + propKey);
							this.printValidValuesOfProperty(prop).wait();
						});
					} else {
						// 'appbuilder prop print' called inside project dir
						let propKeys = _.keys(mergedProjectData);
						let sortedProperties = _.sortBy(propKeys, (propertyName: string) => propertyName.toUpperCase());
						_.each(sortedProperties, (propertyName: string) => this.$logger.out(propertyName + ": " + mergedProjectData[propertyName]));
						this.printConfigurationSpecificData(configuration);
					}
				}
			} else {
				// We'll get here only when command is called outside of project directory and --validValue is specified
				if (property) {
					let targetFrameworkIdentifiers = _.values(TARGET_FRAMEWORK_IDENTIFIERS);
					_.each(targetFrameworkIdentifiers, (targetFrameworkIdentifier: string) => {
						let projectSchema: IDictionary<any> = this.$jsonSchemaValidator.tryResolveValidationSchema(targetFrameworkIdentifier);
						let currentProp = _.find(_.keys(projectSchema), key => key === property);
						if (currentProp) {
							this.$logger.out("  Project type %s:", targetFrameworkIdentifier);
							this.printValidValuesOfProperty(projectSchema[currentProp]).wait();
						}
					});
				} else {
					this.$logger.out(this.$projectPropertiesService.getPropertiesForAllSupportedProjects().wait());
				}
			}
	}

	public checkSdkVersions(platform: string): void {
		this.frameworkProject.checkSdkVersions(platform, this.projectData);
	}

	private async printValidValuesOfProperty(property: any): Promise<void> {
			if (property.description) {
				this.$logger.info("%s%s", Project.INDENTATION, property.description);
			}

			if (property.pattern) {
				this.$logger.trace("%sDesired pattern is: %s", Project.INDENTATION, property.pattern);
			}

			let validValues: string[] = await  this.$projectPropertiesService.getValidValuesForProperty(property);
			if (validValues) {
				this.$logger.out("%sValid values:", Project.INDENTATION);
				_.forEach(validValues, value => {
					this.$logger.out("%s  %s", Project.INDENTATION, value);
				});
			}
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

		return [_.map(property, (value, key) => {
			// use '\n' not os.EOL as cli-table does not handle \r\n very well
			let delimiter = typeof value === "string" || value instanceof Array ? " " : '\n';
			return util.format('%s%s:%s%s', indentation, key, delimiter, this.getPropertyValueAsArray(value, indentation + '   ').join('\n'));
		})];
	}

	private getConfigurationSpecificDataForProperty(normalizedPropertyName: string, configuration?: string): any[] {
		let numberOfConfigs = configuration ? 1 : this.getAllConfigurationsNames().length;
		let configsDataForProperty: any[] = configuration ?
			this.getPropertyValueAsArray(this.configurationSpecificData[configuration][normalizedPropertyName], '') :
			_(this.configurationSpecificData)
				.values()
				.map((config: IDictionary<string>) => _.flatten(this.getPropertyValueAsArray(config[normalizedPropertyName], '')))
				.value();
		let sharedValues: string[] = _.intersection.apply(null, configsDataForProperty);
		let valuesInAllConfigs = _.map(sharedValues, value => helpers.fill(value, numberOfConfigs));
		let configSpecificValues = _.map(configsDataForProperty, config => _.difference(config, sharedValues));

		let maxLength = _(configSpecificValues)
			.map(value => value.length)
			.max();

		_.range(maxLength)
			.map(valueIndex => _.map(configSpecificValues, config => config[valueIndex] || ""))
			.forEach(propertyValues => valuesInAllConfigs.push(propertyValues));

		return valuesInAllConfigs;
	}

	private printConfigurationSpecificData(configuration: string): void {
		let properties: string[];
		if (configuration) {
			properties = _.keys(this.configurationSpecificData[configuration]);
		} else {
			properties = _(this.configurationSpecificData)
				.values()
				.map(_properties => _.keys(_properties))
				.flatten<string>()
				.uniq()
				.value();
		}

		if (properties.length > 0) {
			this.$logger.out("%sConfiguration specific properties: ", EOL);
			_.forEach(properties, property => this.printConfigurationSpecificDataForProperty(property, configuration));
		}
	}

	private printConfigurationSpecificDataForProperty(property: string, configuration?: string): void {
		let data = this.getConfigurationSpecificDataForProperty(property, configuration);
		if (data && data.length) {
			let headers = configuration ? [configuration] : this.getAllConfigurationsNames();
			let table = commonHelpers.createTable(headers, data);
			this.$logger.out("%s:%s%s", property, EOL, table.toString());
		}
	}

	public async validateProjectProperty(property: string, args: string[], mode: string): Promise<boolean> {
			if (!property) {
				this.$errors.fail("Please specify a property name.");
			}

			let validProperties = this.$jsonSchemaValidator.getValidProperties(this.projectData.Framework, this.projectData.FrameworkVersion);
			if (_.includes(validProperties, property)) {
				let normalizedPropertyName = this.$projectPropertiesService.normalizePropertyName(property, this.projectData);
				let isArray = this.$jsonSchemaValidator.getPropertyType(this.projectData.Framework, normalizedPropertyName) === "array";
				if (!isArray) {
					if (!args || args.length === 0) {
						this.$errors.fail("Property %s requires a single value.", property);
					}
					if (args.length !== 1) {
						this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
					}

					if (mode === "add" || mode === "del") {
						this.$errors.fail("Property '%s' is not a collection of flags. Use prop-set to set a property value.", property);
					}
				}

				return true;
			}

			this.$errors.fail("Invalid property name '%s'.", property);
	}

	public async getProjectSchema(): Promise<any> {
			if (!this._projectSchema) {
				this._projectSchema = this.frameworkProject.getProjectFileSchema();
			}

			return this._projectSchema;
	}

	public adjustBuildProperties(buildProperties: any): any {
		return this.frameworkProject.adjustBuildProperties(buildProperties, this.projectInformation);
	}

	public get requiredAndroidApiLevel(): number {
		return this.frameworkProject.requiredAndroidApiLevel;
	}

	public ensureAllPlatformAssets(): void {
		let projectDir = this.getProjectDir();
		this.frameworkProject.ensureAllPlatformAssets(projectDir, this.projectData.FrameworkVersion);
	}

	private validateProjectData(properties: any): void {
		this.$jsonSchemaValidator.validate(properties);
		if (this.capabilities.build) {
			this.$jsonSchemaValidator.validatePropertyUsingBuildSchema(this.$projectConstants.APPIDENTIFIER_PROPERTY_NAME, properties.AppIdentifier);
		}
	}

	public saveProject(projectDir: string, configurations?: string[]): void {
		let configs = (configurations && configurations.length > 0) ? configurations : this.configurations;
		projectDir = projectDir || this.getProjectDir();
		this.$fs.writeJson(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME), this.projectData);

		_.each(configs, (configuration: string) => {
			let configFilePath = path.join(projectDir, util.format(".%s%s", configuration, this.$projectConstants.PROJECT_FILE));

			if (this.$fs.exists(configFilePath) && this.configurationSpecificData[configuration]) {
				let configurationSpecificKeys = _.reduce(this.configurationSpecificData[configuration], (result, value, key) => _.isEqual(value, this.projectData[key]) ? result : result.concat(key), []);
				this.$fs.writeJson(configFilePath, _.pick(this.configurationSpecificData[configuration], configurationSpecificKeys));
			}
		});
	}

	public async zipProject(): Promise<string> {
			let tempDir = this.getTempDir();

			let projectZipFile = path.join(tempDir, "Build.zip");
			this.$fs.deleteFile(projectZipFile);
			let projectDir = this.getProjectDir();

			let files = this.enumerateProjectFiles();
			let zipOp = this.$fs.zipFiles(projectZipFile, files,
				p => this.getProjectRelativePath(p, projectDir));

			let result = new Future<string>();
			zipOp.resolveSuccess(() => result.return(projectZipFile));
			return result.wait();
	}

	public async importProject(): Promise<void> {
			this.ensureProject();

			this.$loginManager.ensureLoggedIn().wait();
			let projectZipFile = await  this.zipProject();
			let fileSize = this.$fs.getFileSize(projectZipFile);
			this.$logger.debug("zipping completed, result file size: %s", fileSize.toString());
			let projectName = this.projectData.ProjectName;
			let bucketKey = util.format("%s_%s", projectName, path.basename(projectZipFile));
			this.$logger.printInfoMessageOnSameLine("Uploading...");
			if (fileSize > Project.CHUNK_UPLOAD_MIN_FILE_SIZE) {
				this.$logger.trace("Start uploading file by chunks.");
				this.$progressIndicator.showProgressIndicator(this.$multipartUploadService.uploadFileByChunks(projectZipFile, bucketKey), 2000, { surpressTrailingNewLine: true }).wait();
				this.$progressIndicator.showProgressIndicator(this.$server.projects.importLocalProject(projectName, projectName, bucketKey, true), 2000).wait();
			} else {
				this.$progressIndicator.showProgressIndicator(this.$server.projects.importProject(projectName, projectName, true,
					this.$fs.createReadStream(projectZipFile)), 2000).wait();
			}

			this.$logger.trace("Project imported");
	}

	protected validate(): void {
		if (this.$staticConfig.triggerJsonSchemaValidation) {
			this.$jsonSchemaValidator.validate(this.projectData);
		}
	}

	protected saveProjectIfNeeded(): void {
		if (this.getShouldSaveProject() && this.$config.AUTO_UPGRADE_PROJECT_FILE) {
			this.saveProject(this.projectDir);
		}
	}

	private getProjectRelativePath(fullPath: string, projectDir: string): string {
		projectDir = path.join(projectDir, path.sep);
		if (!_.startsWith(fullPath, projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	private async createFromTemplate(appname: string, projectDir: string, template?: string): Promise<void> {
			let templatesDir = this.$templatesService.projectTemplatesDir;
			let selectedTemplate = template || this.frameworkProject.defaultProjectTemplate;
			template = Project.UI_TEMPLATE_NAMES[selectedTemplate.toLowerCase()] || selectedTemplate;
			let templateFileName = path.join(templatesDir, this.frameworkProject.getTemplateFilename(template));

			this.$logger.trace("Using template '%s'", templateFileName);
			if (this.$fs.exists(templateFileName)) {
				projectDir = this.$options.path ? projectDir : path.join(projectDir, appname);
				this.$logger.trace("Creating template folder '%s'", projectDir);
				this.createTemplateFolder(projectDir);
				try {
					this.$logger.trace("Extracting template from '%s'", templateFileName);
					this.$fs.unzip(templateFileName, projectDir, { caseSensitive: false }).wait();
					this.$logger.trace("Reading template project properties.");

					let properties = this.$projectPropertiesService.getProjectProperties(path.join(projectDir, this.$projectConstants.PROJECT_FILE), true, this.frameworkProject);
					properties = this.alterPropertiesForNewProject(properties, appname);
					this.$logger.trace(properties);
					this.$logger.trace("Saving project file.");
					this.createProjectFile(projectDir, properties).wait();
					this.$logger.trace("Removing unnecessary files from template.");
					this.removeExtraFiles(projectDir);
					this.$fs.createDirectory(path.join(projectDir, "hooks"));
					this.$logger.info("Project '%s' has been successfully created in '%s'.", appname, projectDir);
				} catch (ex) {
					this.$fs.deleteDirectory(projectDir);
					throw ex;
				}

				this.frameworkProject.ensureProject(this.projectDir).wait();
			} else {
				let templates = this.frameworkProject.getProjectTemplatesString();
				this.$errors.failWithoutHelp(`The specified template ${this.$options.template} does not exist. You can use any of the following templates:${EOL}${templates}`);
			}
	}

	private alterPropertiesForNewProject(properties: any, projectName: string): Project.IData {
		properties.ProjectGuid = commonHelpers.createGUID();
		properties.ProjectName = projectName;

		this.frameworkProject.alterPropertiesForNewProject(properties, projectName);

		return properties;
	}

	private removeExtraFiles(projectDir: string): void {
		_.each(["mobile.vstemplate"],
			(file) => this.$fs.deleteFile(path.join(projectDir, file)));
	}

	private async getProjectPropertiesFromExistingProject(projectDir: string, appname: string): Promise<Project.IData> {
			let projectFile = _.find(this.$fs.readDirectory(projectDir), file => {
				let extension = path.extname(file);
				return extension === ".proj" || extension === ".iceproj" || file === this.$projectConstants.PROJECT_FILE;
			});

			if (projectFile) {
				let isJsonProjectFile = projectFile === this.$projectConstants.PROJECT_FILE;
				return this.$projectPropertiesService.getProjectProperties(path.join(projectDir, projectFile), isJsonProjectFile, this.frameworkProject);
			}

			this.$logger.warn("No AppBuilder project file found in folder. Creating project with default settings!");
			return null;
	}

	private validateUpdatePropertyInfo(propertyName: string, propertyValues: string[], configurations: string[]): IUpdatePropertyInfo {
		this.ensureProject();

		let projectConfigurations = (configurations && configurations.length) ? configurations : this.getConfigurationsSpecifiedByUser(),
			normalizedPropertyName = this.$projectPropertiesService.normalizePropertyName(propertyName, this.projectData);

		if (normalizedPropertyName === this.$projectConstants.APPIDENTIFIER_PROPERTY_NAME) {
			this.$jsonSchemaValidator.validatePropertyUsingBuildSchema(normalizedPropertyName, propertyValues[0]);
		}

		return { normalizedPropertyName, projectConfigurations };
	}
}
$injector.register("project", Project);

interface IUpdatePropertyInfo {
	normalizedPropertyName: string;
	projectConfigurations: string[];
}
