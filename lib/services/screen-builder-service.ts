import Future = require("fibers/future");
import * as path from "path";
import * as util from "util";

export class ScreenBuilderService implements IScreenBuilderService {
	private static UPGRADE_ERROR_MESSAGES = ["Your app has been build with an obsolete version of Screen Builder. Please, migrate it to latest version and retry.",
		"Your app has been created with an obsolete version of Screen Builder. Upgrade your project to the latest version and try again."];

	private static UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE = "Your app has been created with an obsolete version of Screen Builder. You need to upgrade your project to be able to run Screen Builder-related commands.";
	public static DEFAULT_SCREENBUILDER_TYPE = "application";
	private shouldUpgradeCached: boolean = null;
	private allCommandsCache: string[] = null;
	private scaffolder: any = null;

	private static PREDEFINED_SCREENBUILDER_TYPES: IStringDictionary = {
		dataprovider: "dataProvider"
	};

	constructor(private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
		private $childProcess: IChildProcess,
		private $dependencyConfigService: IDependencyConfigService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $logger: ILogger,
		private $prompter: IPrompter) { }

	public screenBuilderSpecificFiles = [".yo-rc.json", ".app.json", "app.js"];

	public get generatorFullName(): string {
		return "generator-" + this.generatorName;
	}

	public get generatorName(): string {
		return "kendo-ui-mobile";
	}

	public get commandsPrefix(): string {
		return "add";
	}

	private async promptForUpgrade(projectPath: string, generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): Promise<IScreenBuilderMigrationData> {
			let wasMigrated = await  !this.shouldUpgrade(projectPath),
				didMigrate = false;

			if (!wasMigrated) {
				this.$logger.error(ScreenBuilderService.UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE);
				didMigrate = await  this.$prompter.confirm('Do you want to upgrade your project now? Custom code changes might be lost.', () => false);

				if (didMigrate) {
					let scaffolderData = await  this.createScaffolder(projectPath, generatorName, screenBuilderOptions);

					scaffolderData.scaffolder.upgrade(scaffolderData.callback);

					await scaffolderData.future;
				}
			}

			return { wasMigrated: wasMigrated, didMigrate: didMigrate };
	}

	public async prepareAndGeneratePrompt(projectPath: string, generatorName?: string, screenBuilderOptions?: IScreenBuilderOptions): Promise<boolean> {
			generatorName = generatorName || this.generatorFullName;
			let migrationData = await  this.promptForUpgrade(projectPath, generatorName, screenBuilderOptions),
				disableCommandHelpSuggestion = !migrationData.didMigrate;

			if (migrationData.wasMigrated || migrationData.didMigrate) {
				await this.promptGenerate(projectPath, generatorName, screenBuilderOptions).wait().future;
			}

			return disableCommandHelpSuggestion;
	}

	public async allSupportedCommands(projectDir: string, generatorName?: string): Promise<string[]> {
			if (!this.allCommandsCache) {
				generatorName = generatorName || this.generatorFullName;
				let scaffolder = (await  this.createScaffolder(projectDir, generatorName, { isSync: true })).scaffolder;
				let allSupportedCommands = scaffolder.listGenerators()
					.map((command: string) => command.replace(new RegExp(this.generatorName + ":?"), ''))
					.filter((command: string) => !!command);

				this.allCommandsCache = _.map(allSupportedCommands, (command: string) => util.format("%s-%s", this.commandsPrefix, command.toLowerCase()));
			}

			return this.allCommandsCache;
	}

	public async generateAllCommands(projectDir: string, generatorName?: string): Promise<void> {
			generatorName = generatorName || this.generatorFullName;
			let commands = await  this.allSupportedCommands(projectDir, generatorName);
			_.each(commands, (command: string) => this.registerCommand(command, generatorName));
	}

	public composeScreenBuilderOptions(answers: string, bacisSceenBuilderOptions?: IScreenBuilderOptions): IScreenBuilderOptions {
		let screenBuilderOptions = bacisSceenBuilderOptions || {};

		if (answers) {
			screenBuilderOptions.answers = this.$fs.readJson(path.resolve(answers));
		}

		return screenBuilderOptions;
	}

	public async promptGenerate(projectPath: string, generatorName?: string, screenBuilderOptions?: IScreenBuilderOptions): Promise<IScaffolder> {
			generatorName = generatorName || this.generatorFullName;
			let scaffolderData = await  this.createScaffolder(projectPath, generatorName, screenBuilderOptions);
			let scaffolder = scaffolderData.scaffolder;
			let type = screenBuilderOptions.type || ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE;
			type = ScreenBuilderService.PREDEFINED_SCREENBUILDER_TYPES[type] || type;

			if (type === ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE || screenBuilderOptions.answers) {
				scaffolder.promptGenerate(type, screenBuilderOptions.answers, scaffolderData.callback);
			} else {
				scaffolder.promptGenerate(type, scaffolderData.callback);
			}

			return scaffolderData;
	}

	public ensureScreenBuilderProject(projectDir: string): void {
		if (!_.every(this.screenBuilderSpecificFiles, file => this.$fs.exists(path.join(projectDir, file)))) {
			this.$errors.failWithoutHelp("This command is applicable only to Screen Builder projects.");
		}
	}

	public async shouldUpgrade(projectPath: string): Promise<boolean> {
			if (!this.shouldUpgradeCached) {
				let scaffolderData = await  this.createScaffolder(projectPath, this.generatorFullName);

				scaffolderData.scaffolder.initContext({ collectMetadata: true }, scaffolderData.callback);

				this.shouldUpgradeCached = await  scaffolderData.future === ScreenBuilderService.UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE;
			}

			return this.shouldUpgradeCached;
	}

	public async upgrade(projectPath: string): Promise<void> {
			if (! await this.shouldUpgrade(projectPath)) {
				return;
			}

			let scaffolderData = await  this.createScaffolder(this.generatorFullName, projectPath);

			scaffolderData.scaffolder.upgrade(scaffolderData.callback);

			await scaffolderData.future;
	}

	private async getScaffolder(projectPath: string, generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): Promise<any> {
			if (!this.scaffolder) {
				await this.$appScaffoldingExtensionsService.prepareAppScaffolding();

				let generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName);

				let appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;

				let cliServicePath = path.join(appScaffoldingPath, "lib/cliService");
				let Scaffolder = require(cliServicePath);
				let connector = {
					generatorsCache: appScaffoldingPath,
					path: screenBuilderOptions && screenBuilderOptions.projectPath || path.resolve(projectPath || "."),
					dependencies: [util.format("%s@%s", generatorName, generatorConfig.version)],
					connect: (done: Function) => {
						done();
					},
					logger: this.$logger.trace.bind(this.$logger)
				};

				this.scaffolder = new Scaffolder(connector);
			}

			return this.scaffolder;
	}

	private async createScaffolder(projectPath: string, generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): Promise<IScaffolder> {
			screenBuilderOptions = screenBuilderOptions || {};

			let scaffolder = await  this.getScaffolder(projectPath, generatorName, screenBuilderOptions);
			if (screenBuilderOptions && screenBuilderOptions.isSync) {
				return { scaffolder: scaffolder, future: null, callback: null };
			}

			let future = new Future<any>();
			let callback = (err: Error, data: any) => {
				if (err) {
					let error = this.getErrorsRecursive(err).join('\n');
					this.$logger.trace(`Screen Builder error while prompting: ${err.message}`);
					if (~ScreenBuilderService.UPGRADE_ERROR_MESSAGES.indexOf(err.message)) {
						future.return(ScreenBuilderService.UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE);
					} else {
						future.throw(new Error(error));
					}
				} else {
					future.return(data);
				}
			};

			return { scaffolder: scaffolder, future: future, callback: callback };
	}

	private getErrorsRecursive(errorObject: any): string[] {
		let errorMessage = errorObject.message,
			childErrors = _(<any[]>errorObject.errors)
				.map(errObj => this.getErrorsRecursive(errObj))
				.flatten<string>()
				.value();

		return _.union([errorMessage], childErrors);
	}

	private registerCommand(command: string, generatorName: string): void {
		this.$injector.requireCommand(command, "./commands/user-status");
		this.$injector.registerCommand(command, this.createResolver(command, generatorName));
	}

	private createResolver(command: string, generatorName: string): void {
		return this.$injector.resolve(ScreenBuilderDynamicCommand, { command: command, generatorName: generatorName });
	}
}
$injector.register("screenBuilderService", ScreenBuilderService);

class ScreenBuilderDynamicCommand implements ICommand {
	public disableCommandHelpSuggestion: boolean;

	constructor(public generatorName: string,
		public command: string,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $project: Project.IProject,
		private $screenBuilderService: IScreenBuilderService) { }

	public async execute(args: string[]): Promise<void> {
			this.$project.ensureProject();
			let projectDir = this.$project.getProjectDir();
			this.$screenBuilderService.ensureScreenBuilderProject(projectDir);

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions(this.$options.answers, {
				type: this.command.substr(this.command.indexOf("-") + 1)
			});

			this.disableCommandHelpSuggestion = await  this.$screenBuilderService.prepareAndGeneratePrompt(projectDir, this.generatorName, screenBuilderOptions);
	}

	public allowedParameters: ICommandParameter[] = [];
}
