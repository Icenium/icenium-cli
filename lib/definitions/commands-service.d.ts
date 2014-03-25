interface ICommandsService {
	allCommands(includeDev: boolean): string[];
	executeCommand(commandName: string, commandArguments: string[]): boolean;
	tryToExecuteCommand(commandName: string, commandArguments: string[]): void;
	executeCommandUnchecked(commandName: string, commandArguments: string[]): boolean;
	completeCommand(): any;
}