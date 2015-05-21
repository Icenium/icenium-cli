///<reference path="../.d.ts"/>
"use strict";
import Future = require("fibers/future");
import path = require("path");
import util = require("util");

export class ScreenBuilderService implements IScreenBuilderService {
	public static DEFAULT_SCREENBUILDER_TYPE = "application";
	private static PREDEFINED_SCREENBUILDER_TYPES: IStringDictionary = {
		dataprovider: "dataProvider"
	};

	constructor(private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
		private $childProcess: IChildProcess,
		private $dependencyConfigService: IDependencyConfigService,
		private $generatorExtensionsService: IGeneratorExtensionsService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions) { }

	public get generatorName(): string {
		return "generator-kendo-ui-mobile";
	}

	public get commandsPrefix(): string {
		return "add";
	}

	public prepareAndGeneratePrompt(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<void> {
		return (() => {
			this.$logger.out("Please, wait while Screen Builder and its dependencies are being configured.");
			this.promptGenerate(generatorName, screenBuilderOptions).wait();
		}).future<void>()();
	}

	public allSupportedCommands(generatorName: string): IFuture<string[]> {
		return (() => {
			generatorName = generatorName || this.generatorName;
			let scaffolderData = this.createScaffolder(generatorName).wait();
			scaffolderData.scaffolder.listGenerators(scaffolderData.callback);
			let allSupportedCommands = scaffolderData.future.wait();
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

	private prepareScreenBuilder(): IFuture<void> {
		return (() => {
			this.$appScaffoldingExtensionsService.prepareAppScaffolding().wait();

			let generators = this.$dependencyConfigService.getAllGenerators().wait();
			_.each(generators, (generator: IGeneratorConfig) => this.$generatorExtensionsService.prepareGenerator(generator.name).wait());
		}).future<void>()();
	}

	private promptGenerate(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<void> {
		let scaffolderData = this.createScaffolder(generatorName, screenBuilderOptions).wait();
		let scaffolder = scaffolderData.scaffolder;
		let type = screenBuilderOptions.type || ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE;
		type = ScreenBuilderService.PREDEFINED_SCREENBUILDER_TYPES[type] || type;

		if(type === ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE) {
			scaffolder.promptGenerate(type, screenBuilderOptions.answers, scaffolderData.callback);
		} else {
			scaffolder.promptGenerate(type, scaffolderData.callback);
		}

		return scaffolderData.future;
	}

	private createScaffolder(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<{ scaffolder: any; future: IFuture<any>; callback: Function }> {
		return (() => {
			this.prepareScreenBuilder().wait();
			screenBuilderOptions = screenBuilderOptions || {};

			let appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;

			let cliServicePath = path.join(appScaffoldingPath, "lib/cliService");
			let Scaffolder = require(cliServicePath);
			let connector = {
				generatorsCache: appScaffoldingPath,
				generatorsAlias: ['H'],
				path: screenBuilderOptions.projectPath || path.resolve(this.$options.path || "."),
				dependencies: [util.format("%s@%s", generatorName, this.$dependencyConfigService.getGeneratorConfig(generatorName).wait().version)],
				connect: (done:Function) => {
					done();
				},
				logger: this.$logger.trace.bind(this.$logger)
			};

			let scaffolder = new Scaffolder(connector);
			let future = new Future<void>();
			let callback = (err:any, data:any) => {
				if (err) {
					let error = _.map(err.errors, (e:any) => e.message).join("\n");
					this.$logger.trace("ScreenBuilder error while prompting: %s", err);
					future.throw(error);
				} else {
					future.return(data);
				}
			};

			return {scaffolder: scaffolder, future: future, callback: callback};
		}).future<{ scaffolder: any; future: IFuture<any>; callback: Function }>()();
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
	private static SCREEN_BUILDER_SPECIFIC_FILES = [".yo-rc.json", ".app.json", "app.js"];

	constructor(public generatorName: string,
		public command: string,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $screenBuilderService: IScreenBuilderService) { }

	public execute(args: string[]): IFuture<void> {
		this.ensureScreenBuilderProject().wait();

		let screenBuilderOptions = {
			type: this.command.substr(this.command.indexOf("-") + 1)
		};
		return this.$screenBuilderService.prepareAndGeneratePrompt(this.generatorName, screenBuilderOptions);
	}

	private ensureScreenBuilderProject(): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			let projectDir = this.$project.getProjectDir().wait();
			if(!_.every(ScreenBuilderDynamicCommand.SCREEN_BUILDER_SPECIFIC_FILES, file => this.$fs.exists(path.join(projectDir, file)).wait())) {
				this.$errors.fail("This command is applicable only to Screen Builder projects.");
			}
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}

