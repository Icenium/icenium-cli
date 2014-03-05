interface ICommandsService {
	allCommands(): string[];
	executeCommand(commandName: string, commandArguments: string[]): boolean;
	completeCommand(): any;
}