// Type definitions for node-fibers
// Project: https://github.com/laverdet/node-fibers
// Definitions by: Cary Haynie <https://github.com/caryhaynie>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

interface Fiber {
	reset: () => any;
	run: (param?: any) => any;
	throwInto: (ex: any) => any;
}

interface IFuture<T> {
	detach(): void;
	get(): T;
	isResolved (): boolean;
	proxy<U>(future: IFuture<U>): void;
	proxyErrors(future: IFuture<any>): IFuture<T>;
	proxyErrors(futureList: IFuture<any>[]): IFuture<T>;
	resolver(): Function;
	resolve(fn: (err: any, result?: T) => void): void;
	resolveSuccess(fn: (result: T) => void): void;
	return(result?: T): void;
	throw(error: any): void;
	wait(): T;
}

declare module "fibers" {

	function Fiber(fn: Function): Fiber;

	module Fiber {
		export var current: Fiber;
		export function yield(value?: any): any
	}

export = Fiber;
}

interface ICallableFuture<T> {
	(...args: any[]): IFuture<T>;
}

interface IFutureFactory<T> {
	(): IFuture<T>;
}

interface Function {
	future<T>(...args: any[]): IFutureFactory<T>;
}

declare module "fibers/future" {

	class Future<T> implements IFuture<T> {
		constructor();
		detach(): void;
		get(): T;
		isResolved (): boolean;
		proxy<U>(future: IFuture<U>): void;
		proxyErrors(future: IFuture<any>): IFuture<T>;
		proxyErrors(futureList: IFuture<any>[]): IFuture<T>;
		resolver(): Function;
		resolve(fn: Function): void;
		resolveSuccess(fn: Function): void;
		return(result?: T): void;
		throw (error: any): void;
		wait(): T;

		static wait<T>(future: IFuture<T>);
		static wait(future_list: IFuture<any>[]);
		static wait(...future_list: IFuture<any>[]);

		static settle<T>(future: IFuture<T>);
		static settle(future_list: IFuture<any>[]);
		static settle(...future_list: IFuture<any>[]);

		static wrap<T>(fn: (callback: (error: Error, result: T) => void) => void): ICallableFuture<T>;
		static wrap<T>(fn: (a: any, callback: (error: Error, result: T) => void) => void): ICallableFuture<T>;
		static wrap<T>(fn: (a: any, b: any, callback: (error: Error, result: T) => void) => void): ICallableFuture<T>;

		static fromResult<T>(value: T): IFuture<T>;
		static fromResult(): IFuture<void>;

		static assertNoFutureLeftBehind(): void;
	}

export = Future;
}