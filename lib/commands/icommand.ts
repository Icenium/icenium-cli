///<reference path="../.d.ts"/>
"use strict";

export module Commands {
	export interface ICommandData {}

	export interface ICommandDataFactory {
		fromCliArguments(args: string[]): ICommandData;
	}

	export interface ICommand<ICommandData> {
		getDataFactory(): ICommandDataFactory;
		canExecute(data: ICommandData): boolean;
		execute(data: ICommandData): void;
	}
}

