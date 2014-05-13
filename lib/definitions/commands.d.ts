interface ICommand extends ICommandOptions {
	execute(args: string[]): IFuture<void>;
}