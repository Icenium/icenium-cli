interface ICommand {
	execute(args: string[]): void;
	requiresActiveAccount?: boolean;
}