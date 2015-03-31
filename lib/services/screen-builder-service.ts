///<reference path="../.d.ts"/>
"use strict";
import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import options = require("../options");

export class ScreenBuilderService implements IScreenBuilderService {
	public static DEFAULT_SCREENBUILDER_TYPE = "application";

	constructor(private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
		private $childProcess: IChildProcess,
		private $dependencyConfigService: IDependencyConfigService,
		private $generatorExtensionsService: IGeneratorExtensionsService,
		private $injector: IInjector,
		private $logger: ILogger) { }

	public get generatorName(): string {
		return "generator-kendo-ui-mobile";
	}

	public prepareAndGeneratePrompt(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<void> {
		return (() => {
			this.$logger.out("Please, wait while Screen Builder and its dependencies are being configured.");
			this.promptGenerate(generatorName, screenBuilderOptions).wait();
		}).future<void>()();
	}

	public allSupportedCommands(generatorName: string): IFuture<string[]> {
		return (() => {
			var scaffolderData = this.createScaffolder(generatorName).wait();
			scaffolderData.scaffolder.listGenerators(scaffolderData.callback);
			var allSupportedCommands = scaffolderData.future.wait();
			return _.map(allSupportedCommands, (command:string) => util.format("add-%s", command));
		}).future<string[]>()();
	}

	public generateAllCommands(generatorName: string): IFuture<void> {
		return (() => {
			var commands = this.allSupportedCommands(generatorName).wait();
			_.each(commands, (command: string) => this.registerCommand(command, generatorName));
		}).future<void>()();
	}

	public installAppDependencies(): IFuture<void> {
		this.$logger.trace("Installing project dependencies using bower");
		var projectDirPath = path.resolve(options.path || ".");
		return this.$childProcess.exec("bower install", { cwd: projectDirPath });
	}

	private prepareScreenBuilder(): IFuture<void> {
		return (() => {
			this.$appScaffoldingExtensionsService.prepareAppScaffolding().wait();

			var generators = this.$dependencyConfigService.getAllGenerators().wait();
			_.each(generators, (generator: IGeneratorConfig) => this.$generatorExtensionsService.prepareGenerator(generator.name).wait());
		}).future<void>()();
	}

	private promptGenerate(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<void> {
		var scaffolderData = this.createScaffolder(generatorName, screenBuilderOptions).wait();
		var scaffolder = scaffolderData.scaffolder;
		var type = screenBuilderOptions.type || ScreenBuilderService.DEFAULT_SCREENBUILDER_TYPE;

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

			var appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;

			var cliServicePath = path.join(appScaffoldingPath, "lib/cliService");
			var Scaffolder = require(cliServicePath);
			var connector = {
				generatorsCache: appScaffoldingPath,
				generatorsAlias: ['H'],
				path: screenBuilderOptions.projectPath || path.resolve(options.path || "."),
				dependencies: util.format("%s@latest", generatorName),
				connect: (done:Function) => {
					done();
				},
				logger: this.$logger.trace.bind(this.$logger)
			};

			var scaffolder = new Scaffolder(connector);
			var future = new Future<void>();
			var callback = (err:any, data:any) => {
				if (err) {
					var error = _.map(err.errors, (e:any) => e.message).join("\n");
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
	constructor(public generatorName: string,
		public command: string,
		private $screenBuilderService: IScreenBuilderService) { }

	public execute(args: string[]): IFuture<void> {
		var screenBuilderOptions = {
			type: this.command.substr(this.command.indexOf("-") + 1)
		};
		return this.$screenBuilderService.prepareAndGeneratePrompt(this.generatorName, screenBuilderOptions);
	}

	public allowedParameters: ICommandParameter[] = [];
}

