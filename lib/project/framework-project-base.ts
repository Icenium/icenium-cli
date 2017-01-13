export abstract class FrameworkProjectBase implements Project.IFrameworkProjectBase {
	protected static MAX_MIGRATION_FILE_EDIT_TIME_DIFFERENCE = 60 * 60 * 1000 * 2;
	private assetUpdateMessagePrinted = false;

	constructor(protected $logger: ILogger,
		protected $fs: IFileSystem,
		protected $resources: IResourceLoader,
		protected $errors: IErrors,
		protected $jsonSchemaValidator: IJsonSchemaValidator,
		protected $options: IOptions) { }

	public alterPropertiesForNewProjectBase(properties: any, projectName: string): void {
		properties.DisplayName = projectName;
		properties.Description = projectName;
		let appid = this.$options.appid;
		if (!this.$options.appid) {
			appid = this.generateDefaultAppId(projectName);
			this.$logger.warn("--appid was not specified. Defaulting to " + appid);
		}

		properties.AppIdentifier = appid;
	}

	public getProjectFileSchemaByName(name: string): IDictionary<any> {
		return this.$jsonSchemaValidator.tryResolveValidationSchema(name);
	}

	public getProjectTargetsBase(dir: string, fileMask: RegExp): string[] {
		let result: string[] = [];

		if (dir) {
			let files = this.$fs.readDirectory(dir);
			_.each(files, (file) => {
				let matches = file.match(fileMask);
				if (matches) {
					result.push(matches[1].toLowerCase());
				}
			});
		}

		return result;
	}

	public printAssetUpdateMessage(): void {
		if (!this.assetUpdateMessagePrinted) {
			this.$logger.info("Setting up missing asset files. Commit these assets into your source control repository.");
			this.assetUpdateMessagePrinted = true;
		}
	}

	public getProperty(propertyName: string, configuration: string, projectInformation: Project.IProjectInformation): any {
		let propertyValue: any = null;
		let configData = projectInformation.configurationSpecificData[configuration];
		if (configData && configData[propertyName]) {
			propertyValue = configData[propertyName];
		} else {
			propertyValue = projectInformation.projectData[propertyName];
		}

		return propertyValue;
	}

	public completeProjectProperties(properties: any): boolean {
		let updated = false;

		if (_.has(properties, "name")) {
			properties.ProjectName = properties.name;
			delete properties.name;
			updated = true;
		}

		if (!properties.DisplayName) {
			properties.DisplayName = properties.iOSDisplayName ? properties.iOSDisplayName : properties.ProjectName;
			updated = true;
		}

		if (_.has(properties, "iOSDisplayName")) {
			delete properties.iOSDisplayName;
			updated = true;
		}

		return updated;
	}

	public abstract async ensureProject(projectDir: string): Promise<void>;

	public abstract async updateMigrationConfigFile(): Promise<void>;

	private generateDefaultAppId(appName: string): string {
		let sanitizedName = _.filter(appName.split(""), c => /[a-zA-Z0-9]/.test(c)).join("");
		if (sanitizedName) {
			if (/^\d.*$/.test(sanitizedName)) {
				sanitizedName = "the" + sanitizedName;
			}
			return "com.telerik." + sanitizedName;
		} else {
			return "com.telerik.the";
		}
	}
}
