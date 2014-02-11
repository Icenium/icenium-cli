interface IInjector {
	require(name: string, file: string): void;
	requireCommand(name: string, file: string): void;
	resolve(ctor: Function, ctorArguments?: {[key: string]: {}}): any;
	resolve(name: string): any;
	resolveCommand(name: string): ICommand;
	register(name: string, resolver: any): void;
	registerCommand(name: string, resolver: any): void;
	getRegisteredCommandsNames(): string[];
}

declare var $injector: IInjector;