///<reference path="../.d.ts"/>
"use strict";
import Future = require("fibers/future");
import * as path from "path";
import * as util from "util";

export class ScreenBuilderService implements IScreenBuilderService {
	private static SCREEN_BUILDER_SPECIFIC_FILES = [".yo-rc.json", ".app.json", "app.js"];
	private static UPGRADE_ERROR_MESSAGE = "Your app has been build with an obsolete version of Screen Builder. Please, migrate it to latest version and retry.";
	// This constant is introduced due to the original message (the one above)
	// not being descriptive enough.
	// It should be removed once Screen Builder team fixes the message from their side in the next version.
	private static UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE = "Your app has been created with an obsolete version of Screen Builder. You need to upgrade your project to be able to run Screen Builder-related commands.";
	public static DEFAULT_SCREENBUILDER_TYPE = "application";
	private shouldUpgradeCached: boolean = null;

	private static PREDEFINED_SCREENBUILDER_TYPES: IStringDictionary = {
		dataprovider: "dataProvider"
	};

	constructor(private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $dependencyConfigService: IDependencyConfigService,
		private $generatorExtensionsService: IGeneratorExtensionsService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $fs: IFileSystem) { }

	public get generatorName(): string {
		return "generator-kendo-ui-mobile";
	}

	public get commandsPrefix(): string {
		return "add";
	}

	public prepareAndGeneratePrompt(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<boolean> {
		return (() => {
			let scaffolderData = this.promptGenerate(generatorName, screenBuilderOptions).wait(),
				scaffolderFutureResult = scaffolderData.future.wait(),
				disableCommandHelpSuggestion = false;

			if (scaffolderFutureResult === ScreenBuilderService.UPGRADE_ERROR_MESSAGE) {
				this.$logger.error(ScreenBuilderService.UPGRADE_ERROR_MESSAGE_SHOWN_ON_THE_CONSOLE);
				let shouldMigrate = this.$prompter.confirm('Do you want to upgrade your project now? Custom code changes might be lost.', () => false).wait();

				if (shouldMigrate) {
					let future = new Future<any>();
					let callback = (err:Error, data:any) => {
						if (err) {
							let error = this.getErrorsRecursive(err).join('\n');
							this.$logger.trace(`Screen Builder error: ${err.message}`);
							future.throw(new Error(error));
						} else {
							future.return(data);
						}
					};

					scaffolderData.scaffolder.upgrade(callback);

					future.wait();
					this.promptGenerate(generatorName, screenBuilderOptions).wait().future.wait();
				}

				disableCommandHelpSuggestion = !shouldMigrate;
			}

			return disableCommandHelpSuggestion;
		}).future<boolean>()();
	}

	public allSupportedCommands(generatorName: string): IFuture<string[]> {
		return (() => {
			generatorName = generatorName || this.generatorName;
			// We should use "scaffolderData.scaffolder.listGenerators(scaffolderData.callback);"" but this generates empty app.json and .rc files every time
			// and decided to list manually supported commands from .schema.json file for specified generator

			let generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName).wait();
			let pathToGenerator = path.join(this.$appScaffoldingExtensionsService.appScaffoldingPath, generatorConfig.alias, generatorConfig.version, "node_modules", generatorName);
			if (!this.$fs.exists(pathToGenerator).wait()) {
				this.prepareScreenBuilder().wait();
			}

			let schema = require(path.join(pathToGenerator, ".schema.json"));
			let allSupportedCommands = _.keys(schema);
			return _.map(allSupportedCommands, (command:string) => util.format("%s-%s", this.commandsPrefix, command.toLowerCase()));
		}).future<string[]>()();
	}

	public generateAllCommands(generatorName: string): IFuture<void> {
		return (() => {
			let commands = this.allSupportedCommands(generatorName).wait();
			_.each(commands, (command: string) => this.registerCommand(command, generatorName));
		}).future<void>()();
	}

	public installAppDependencies(screenBuilderOptions: IScreenBuilderOptions): IFuture<void> {
		this.$logger.trace("Installing project dependencies using bower");

		let projectDirPath = path.resolve(this.$options.path || ".");
		let bowerModuleFilePath = require.resolve("bower");
		let bowerPath = path.join(bowerModuleFilePath, "../../", "bin", "bower");
		let command = util.format("%s %s install", "node", bowerPath);
		return this.$childProcess.exec(command, { cwd: projectDirPath });
	}

	public composeScreenBuilderOptions(bacisSceenBuilderOptions?: IScreenBuilderOptions): IFuture<IScreenBuilderOptions> {
		return (() => {
			let screenBuilderOptions = bacisSceenBuilderOptions || {};

			if(this.$options.answers) {
				screenBuilderOptions.answers = this.$fs.readJson(path.resolve(this.$options.answers)).wait();
			}

			return screenBuilderOptions;
		}).future<IScreenBuilderOptions>()();
	}

	public promptGenerate(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<IScaffolder> {
		return (() => {
			let scaffolderData = this.createScaffolder(generatorName, screenBuilderOptions).wait();
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

	public ensureScreenBuilderProject(projectDir: string): IFuture<void> {
		return (() => {
			if(!_.every(ScreenBuilderService.SCREEN_BUILDER_SPECIFIC_FILES, file => this.$fs.exists(path.join(projectDir, file)).wait())) {
				this.$errors.failWithoutHelp("This command is applicable only to Screen Builder projects.");
			}
		}).future<void>()();
	}

	public shouldUpgrade(): IFuture<boolean> {
		return (() => {
			if (!this.shouldUpgradeCached) {
				let scaffolderData = this.createScaffolder(this.generatorName).wait();

				scaffolderData.scaffolder.initContext({ collectMetadata: true }, scaffolderData.callback);

				this.shouldUpgradeCached = scaffolderData.future.wait() === ScreenBuilderService.UPGRADE_ERROR_MESSAGE;
			}

			return this.shouldUpgradeCached;
		}).future<boolean>()();
	}

	public upgrade(): IFuture<void> {
		return (() => {
			if (!this.shouldUpgrade().wait()) {
				return;
			}

			let scaffolderData = this.createScaffolder(this.generatorName).wait();

			scaffolderData.scaffolder.upgrade(scaffolderData.callback);

			scaffolderData.future.wait();
		}).future<void>()();
	}

	private prepareScreenBuilder(): IFuture<void> {
		return (() => {
			this.$logger.out("Please, wait while Screen Builder and its dependencies are being configured.");
			this.$appScaffoldingExtensionsService.prepareAppScaffolding().wait();

			let generators = this.$dependencyConfigService.getAllGenerators().wait();
			_.each(generators, (generator: IGeneratorConfig) => this.$generatorExtensionsService.prepareGenerator(generator.name).wait());
		}).future<void>()();
	}

	private getScaffolder(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<any> {
		return (() => {
			let generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName).wait();

			let appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;

			let cliServicePath = path.join(appScaffoldingPath, "lib/cliService");
			let Scaffolder = require(cliServicePath);
			let connector = {
				generatorsCache: appScaffoldingPath,
				generatorsAlias: [generatorConfig.alias],
				path: screenBuilderOptions && screenBuilderOptions.projectPath || path.resolve(this.$options.path || "."),
				dependencies: [util.format("%s@%s", generatorName, generatorConfig.version)],
				connect: (done:Function) => {
					done();
				},
				logger: this.$logger.trace.bind(this.$logger)
			};

			return new Scaffolder(connector);
		}).future<IScaffolder>()();
	}

	private createScaffolder(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<IScaffolder> {
		return (() => {
			this.prepareScreenBuilder().wait();
			screenBuilderOptions = screenBuilderOptions || {};

			let scaffolder = this.getScaffolder(generatorName, screenBuilderOptions).wait();
			let future = new Future<any>();
			let callback = (err:Error, data:any) => {
				if (err) {
					let error = this.getErrorsRecursive(err).join('\n');
					this.$logger.trace(`Screen Builder error while prompting: ${err.message}`);
					if (err.message === ScreenBuilderService.UPGRADE_ERROR_MESSAGE) {
						future.return(ScreenBuilderService.UPGRADE_ERROR_MESSAGE);
					} else {
						future.throw(new Error(error));
					}
				} else {
					future.return(data);
				}
			};

			return {scaffolder: scaffolder, future: future, callback: callback};
		}).future<IScaffolder>()();
	}

	private getErrorsRecursive(errorObject: any): string[] {
		let errorMessage = errorObject.message,
			childErrors = _(errorObject.errors)
							.map(errObj => this.getErrorsRecursive(errObj))
							.flatten<string>()
							.value();

		return _.union([errorMessage], childErrors);
	}

	private registerCommand(command: string, generatorName: string): void {
		this.$injector.requireCommand(command,  "./commands/user-status");
		this.$injector.registerCommand(command, this.createResolver(command, generatorName));
	}

	private createResolver(command: string, generatorName: string): void {
		return this.$injector.resolve(ScreenBuilderDynamicCommand, {command: command, generatorName: generatorName});
	}
}
$injector.register("screenBuilderService", ScreenBuilderService);

class ScreenBuilderDynamicCommand implements ICommand {
	public disableCommandHelpSuggestion: boolean;

	constructor(public generatorName: string,
		public command: string,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $screenBuilderService: IScreenBuilderService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureProject();
			let projectDir = this.$project.getProjectDir().wait();
			this.$screenBuilderService.ensureScreenBuilderProject(projectDir).wait();

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions({
				type: this.command.substr(this.command.indexOf("-") + 1)
			}).wait();

			this.disableCommandHelpSuggestion = this.$screenBuilderService.prepareAndGeneratePrompt(this.generatorName, screenBuilderOptions).wait();
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}
