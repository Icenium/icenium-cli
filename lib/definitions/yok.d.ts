interface IInjector {
	require(name: string, file: string): void;
	requireCommand(name: string, file: string): void;
	resolve(ctor: Function): any;
	resolve(name: string): any;
	resolveCommand(name: string): void;
	register(name: string, resolver: any): void;
	registerCommand(name: string, resolver: any): void;
}

declare var $injector: IInjector;