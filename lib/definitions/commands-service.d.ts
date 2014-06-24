interface ICommandsService {
	allCommands(includeDev: boolean): string[];
	executeCommand(commandName: string, commandArguments: string[]): boolean;
	tryExecuteCommand(commandName: string, commandArguments: string[]): void;
	executeCommandUnchecked(commandName: string, commandArguments: string[]): boolean;
	completeCommand(): IFuture<any>;
}