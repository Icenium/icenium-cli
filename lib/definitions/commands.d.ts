interface ICommand {
	execute(args: string[]): IFuture<void>;
}