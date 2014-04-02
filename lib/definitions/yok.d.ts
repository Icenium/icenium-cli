interface IInjector {
	require(name: string, file: string): void;
	require(names: string[], file: string): void;
	requireCommand(name: string, file: string): void;
	requireCommand(names: string[], file: string): void;
	resolve(ctor: Function, ctorArguments?: {[key: string]: any}): any;
	resolve(name: string): any;
	resolveCommand(name: string): ICommand;
	register(name: string, resolver: any, shared?: boolean): void;
	registerCommand(name: string, resolver: any): void;
	registerCommand(names: string[], resolver: any): void;
	getRegisteredCommandsNames(includeDev: boolean): string[];
}

declare var $injector: IInjector;