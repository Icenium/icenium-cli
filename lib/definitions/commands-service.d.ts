interface ICommandsService {
	executeCommand(commandName: string, commandArguments: string[]): boolean;
	completeCommand(): any;
}