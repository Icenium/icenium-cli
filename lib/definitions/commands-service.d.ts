interface ICommandsService {
	allCommands(includeDev: boolean): string[];
	executeCommand(commandName: string, commandArguments: string[]): boolean;
	executeCommandUnchecked(commandName: string, commandArguments: string[]): boolean;
	completeCommand(): any;
}