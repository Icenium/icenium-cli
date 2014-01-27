///<reference path="../.d.ts"/>
"use strict";

export class BaseCommand<T extends Commands.ICommandData> implements Commands.ICommand<T> {
	public getDataFactory(): Commands.ICommandDataFactory {
		return { fromCliArguments: () => null };
	}

	public canExecute(data: T): boolean {
		return true;
	}

	public execute(data: T): void {
		throw new Error("This method is abstract");
	}
}

export class BaseParameterlessCommand implements Commands.IParameterlessCommand {
	public canExecute(): boolean {
		return true;
	}

	public execute(): void {
		throw new Error("This method is abstract");
	}
}