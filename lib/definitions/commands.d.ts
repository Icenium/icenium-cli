declare module Commands {
	interface ICommandData {}

	interface ICommandDataFactory {
		fromCliArguments(args: string[]): ICommandData;
	}

	interface ICommand<ICommandData> {
		getDataFactory(): ICommandDataFactory;
		canExecute(data: ICommandData): boolean;
		execute(data: ICommandData): void;
	}
}