interface ICommand {
	execute(args: string[]): IFuture<void>;
	isDisabledFeatureTracking?: boolean;
}