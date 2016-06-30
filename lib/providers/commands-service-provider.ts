import * as initCommandLib from "../commands/project/init-project";
import * as projectCommandLib from "../commands/project/create-project";
import * as samplesLib from "../commands/samples";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/constants";

class CommandsServiceProvider implements ICommandsServiceProvider {
	private commands: IDynamicSubCommandInfo[];
	private mapCommandNameToFramework: IStringDictionary;

	constructor(private $injector: IInjector,
		private $screenBuilderService: IScreenBuilderService) {

		this.mapCommandNameToFramework = {
			hybrid: TARGET_FRAMEWORK_IDENTIFIERS.Cordova,
			native: TARGET_FRAMEWORK_IDENTIFIERS.NativeScript
		};

		this.commands = [
			{
				commandConstructor: projectCommandLib.CreateProjectCommand,
				baseCommandName: "create",
				filePath: "./commands/project/create-project"
			},
			{
				commandConstructor: initCommandLib.InitProjectCommand,
				baseCommandName: "init",
				filePath: "./commands/project/init-project"
			},
			{
				commandConstructor: samplesLib.PrintSamplesCommand,
				baseCommandName: "sample",
				filePath: "./commands/samples"
			}
		];
	}

	public get dynamicCommandsPrefix(): string {
		return this.$screenBuilderService.commandsPrefix;
	}

	public getDynamicCommands(): IFuture<string[]> {
		return this.$screenBuilderService.allSupportedCommands(this.$injector.resolve("project").getProjectDir().wait(), this.$screenBuilderService.generatorFullName);
	}

	public generateDynamicCommands(): IFuture<void> {
		return this.$screenBuilderService.generateAllCommands(this.$injector.resolve("project").getProjectDir().wait(), this.$screenBuilderService.generatorFullName);
	}

	public registerDynamicSubCommands(): void {
		_.each(this.commands, command => {
			this.registerDynamicSubCommand(command);
		});
	}

	private registerDynamicSubCommand(command: IDynamicSubCommandInfo): void {
		let subCommands = _.keys(this.mapCommandNameToFramework);
		_.each(subCommands, subCommand => {
			let resolver = this.$injector.resolve(command.commandConstructor, { frameworkIdentifier: this.mapCommandNameToFramework[subCommand] });
			let name = `${command.baseCommandName}|${subCommand}`;
			this.$injector.requireCommand(name, command.filePath);
			this.$injector.registerCommand(name, resolver);
		});
	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);
