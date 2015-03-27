///<reference path="../.d.ts"/>
"use strict";
import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import options = require("../options");

export class ScreenBuilderService implements IScreenBuilderService {
	constructor(private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
		private $childProcess: IChildProcess,
		private $dependencyConfigService: IDependencyConfigService,
		private $fs: IFileSystem,
		private $generatorExtensionsService: IGeneratorExtensionsService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $progressIndicator: IProgressIndicator) { }

	public prepareAndGeneratePrompt(generatorName: string, type?: string): IFuture<void> {
		return (() => {
			this.$logger.out("Preparing ScreenBuilder..");
			this.$progressIndicator.showProgressIndicator(this.prepareScreenBuilder(), 2000).wait();
			this.promptGenerate(generatorName, type).wait();
		}).future<void>()();
	}

	public allSupportedCommands(): IFuture<string[]> {
		return (() => {
			var generators = this.$dependencyConfigService.getAllGenerators().wait();
			var generator = _.first(generators); // Currently we support only one generator.

			var schemaFilePath = path.join(this.$generatorExtensionsService.getGeneratorCachePath(generator.name), ".schema.json");
			var schemaContent = this.$fs.readJson(schemaFilePath).wait();
			var allSupportedCommands = _.keys(schemaContent);
			return _.map(allSupportedCommands, (command:string) => util.format("add-%s", command));
		}).future<string[]>()();
	}

	public generateAllCommands(generatorName: string): IFuture<void> {
		return (() => {
			var commands = this.allSupportedCommands().wait();
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
			var appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;
			this.npmInstall(appScaffoldingPath).wait();

			var generators = this.$dependencyConfigService.getAllGenerators().wait();
			_.each(generators, (generator: IGeneratorConfig) => {
				var generatorName = generator.name;
				this.$generatorExtensionsService.prepareGenerator(generatorName).wait();
				this.npmInstall(this.$generatorExtensionsService.getGeneratorCachePath(generatorName)).wait();
			});
		}).future<void>()();
	}

	private promptGenerate(generatorName: string, type?: string): IFuture<void> {
		var appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;
		var dependencies = [util.format("%s@latest", generatorName)];

		var cliServicePath = path.join(appScaffoldingPath, "lib/cliService");
		var Scaffolder = require(cliServicePath);
		var connector = {
			generatorsCache: path.join(appScaffoldingPath, "cache"),
			path: path.resolve(options.path || "."),
			dependencies: dependencies,
			connect: (done: Function) => {
				done();
			},
			logger: this.$logger.trace.bind(this.$logger)
		};
		var s = new Scaffolder(connector);

		var future = new Future<void>();

		s.promptGenerate(type, (err:any) => {
			if (err) {
				this.$logger.trace("ScreenBuilder error while prompting: %s", err);
				future.throw(err);
			} else {
				future.return();
			}
		});

		return future;
	}

	private npmInstall(currentWorkingDirectory: string): IFuture<void> {
		return this.$childProcess.exec("npm install", {cwd: currentWorkingDirectory });
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
		return this.$screenBuilderService.prepareAndGeneratePrompt(this.generatorName, this.command);
	}

	public allowedParameters: ICommandParameter[] = [];
}

