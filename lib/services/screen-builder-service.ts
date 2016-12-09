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

	private promptForUpgrade(projectPath: string, generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<IScreenBuilderMigrationData> {
		return (() => {
			let wasMigrated = !this.shouldUpgrade(projectPath).wait(),
				didMigrate = false;

			if (!wasMigrated) {
				this.$logger.error(ScreenBuilderService.UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE);
				didMigrate = this.$prompter.confirm('Do you want to upgrade your project now? Custom code changes might be lost.', () => false).wait();

				if (didMigrate) {
					let scaffolderData = this.createScaffolder(projectPath, generatorName, screenBuilderOptions).wait();

					scaffolderData.scaffolder.upgrade(scaffolderData.callback);

					scaffolderData.future.wait();
				}
			}

			return { wasMigrated: wasMigrated, didMigrate: didMigrate };
		}).future<IScreenBuilderMigrationData>()();
	}

	public prepareAndGeneratePrompt(projectPath: string, generatorName?: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<boolean> {
		return (() => {
			generatorName = generatorName || this.generatorFullName;
			let migrationData = this.promptForUpgrade(projectPath, generatorName, screenBuilderOptions).wait(),
				disableCommandHelpSuggestion = !migrationData.didMigrate;

			if (migrationData.wasMigrated || migrationData.didMigrate) {
				this.promptGenerate(projectPath, generatorName, screenBuilderOptions).wait().future.wait();
			}

			return disableCommandHelpSuggestion;
		}).future<boolean>()();
	}

	public allSupportedCommands(projectDir: string, generatorName?: string): IFuture<string[]> {
		return (() => {
			if (!this.allCommandsCache) {
				generatorName = generatorName || this.generatorFullName;
				let scaffolder = this.createScaffolder(projectDir, generatorName, { isSync: true }).wait().scaffolder;
				let allSupportedCommands = scaffolder.listGenerators()
					.map((command: string) => command.replace(new RegExp(this.generatorName + ":?"), ''))
					.filter((command: string) => !!command);

				this.allCommandsCache = _.map(allSupportedCommands, (command: string) => util.format("%s-%s", this.commandsPrefix, command.toLowerCase()));
			}

			return this.allCommandsCache;
		}).future<string[]>()();
	}

	public generateAllCommands(projectDir: string, generatorName?: string): IFuture<void> {
		return (() => {
			generatorName = generatorName || this.generatorFullName;
			let commands = this.allSupportedCommands(projectDir, generatorName).wait();
			_.each(commands, (command: string) => this.registerCommand(command, generatorName));
		}).future<void>()();
	}

	public composeScreenBuilderOptions(answers: string, bacisSceenBuilderOptions?: IScreenBuilderOptions): IFuture<IScreenBuilderOptions> {
		return (() => {
			let screenBuilderOptions = bacisSceenBuilderOptions || {};

			if (answers) {
				screenBuilderOptions.answers = this.$fs.readJson(path.resolve(answers)).wait();
			}

			return screenBuilderOptions;
		}).future<IScreenBuilderOptions>()();
	}

	public promptGenerate(projectPath: string, generatorName?: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<IScaffolder> {
		return (() => {
			generatorName = generatorName || this.generatorFullName;
			let scaffolderData = this.createScaffolder(projectPath, generatorName, screenBuilderOptions).wait();
			let scaffolder = scaffolderData.scaffolder;
			let type = screenBuilderOptions.type || ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE;
			type = ScreenBuilderService.PREDEFINED_SCREENBUILDER_TYPES[type] || type;

			if (type === ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE || screenBuilderOptions.answers) {
				scaffolder.promptGenerate(type, screenBuilderOptions.answers, scaffolderData.callback);
			} else {
				scaffolder.promptGenerate(type, scaffolderData.callback);
			}

			return scaffolderData;
		}).future<IScaffolder>()();
	}

	public ensureScreenBuilderProject(projectDir: string): void {
		if (!_.every(this.screenBuilderSpecificFiles, file => this.$fs.exists(path.join(projectDir, file)))) {
			this.$errors.failWithoutHelp("This command is applicable only to Screen Builder projects.");
		}
	}

	public shouldUpgrade(projectPath: string): IFuture<boolean> {
		return (() => {
			if (!this.shouldUpgradeCached) {
				let scaffolderData = this.createScaffolder(projectPath, this.generatorFullName).wait();

				scaffolderData.scaffolder.initContext({ collectMetadata: true }, scaffolderData.callback);

				this.shouldUpgradeCached = scaffolderData.future.wait() === ScreenBuilderService.UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE;
			}

			return this.shouldUpgradeCached;
		}).future<boolean>()();
	}

	public upgrade(projectPath: string): IFuture<void> {
		return (() => {
			if (!this.shouldUpgrade(projectPath).wait()) {
				return;
			}

			let scaffolderData = this.createScaffolder(this.generatorFullName, projectPath).wait();

			scaffolderData.scaffolder.upgrade(scaffolderData.callback);

			scaffolderData.future.wait();
		}).future<void>()();
	}

	private getScaffolder(projectPath: string, generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<any> {
		return (() => {
			if (!this.scaffolder) {
				this.$appScaffoldingExtensionsService.prepareAppScaffolding().wait();

				let generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName).wait();

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
		}).future<IScaffolder>()();
	}

	private createScaffolder(projectPath: string, generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<IScaffolder> {
		return (() => {
			screenBuilderOptions = screenBuilderOptions || {};

			let scaffolder = this.getScaffolder(projectPath, generatorName, screenBuilderOptions).wait();
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
		}).future<IScaffolder>()();
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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureProject();
			let projectDir = this.$project.getProjectDir();
			this.$screenBuilderService.ensureScreenBuilderProject(projectDir);

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions(this.$options.answers, {
				type: this.command.substr(this.command.indexOf("-") + 1)
			}).wait();

			this.disableCommandHelpSuggestion = this.$screenBuilderService.prepareAndGeneratePrompt(projectDir, this.generatorName, screenBuilderOptions).wait();
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}
