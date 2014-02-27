///<reference path=".d.ts"/>

import Future = require("fibers/future");
import util = require("util");

export class LoggerStub implements ILogger {
	fatal(formatStr: string, ...args): void {}
	error(formatStr: string, ...args): void {}
	warn(formatStr: string, ...args): void {}
	info(formatStr: string, ...args): void {}
	debug(formatStr: string, ...args): void {}
	trace(formatStr: string, ...args): void {}

	public output = "";

	out(formatStr: string, ...args): void {
		args.unshift(formatStr);
		this.output += util.format.apply(null, args) + "\n";
	}
}

export class FileSystemStub implements IFileSystem {
	zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): IFuture<void> {
		return undefined;
	}
	exists(path: string): IFuture<boolean> {
		return Future.fromResult(true);
	}

	deleteFile(path:string):IFuture<void> {
		return undefined;
	}

	getFileSize(path:string):IFuture<number> {
		return undefined;
	}

	futureFromEvent(eventEmitter, event:string):IFuture<any> {
		return undefined;
	}

	createDirectory(path:string):IFuture<void> {
		return undefined;
	}

	readDirectory(path:string):IFuture<string[]> {
		return undefined;
	}

	readFile(filename:string):IFuture<NodeBuffer> {
		return undefined;
	}

	readText(filename:string, encoding?:string):IFuture<string> {
		return undefined;
	}

	readJson(filename:string, encoding?:string):IFuture<any> {
		return Future.fromResult({});
	}

	writeFile(filename:string, data, encoding?:string):IFuture<void> {
		return undefined;
	}

	writeJson(filename:string, data, space?:string, encoding?:string):IFuture<void> {
		return undefined;
	}

	copyFile(sourceFileName:string, destinationFileName:string):IFuture<void> {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path:string, options?:{flags?: string; encoding?: string; fd?: string; mode?: number; bufferSize?: number}): any {
		return undefined;
	}

	createWriteStream(path:string, options?:{flags?: string; encoding?: string; string?: string}): any {
		return undefined;
	}

	chmod(path: string, mode: number): IFuture<any> {
		return undefined;
	}

	getUniqueFileName(baseName: string): IFuture<string> {
		return undefined;
	}
}

export class ErrorsStub implements IErrors {
	private impl: IErrors = new (require("../lib/errors").Errors)();

	fail(formatStr:string, ...args: any[]): void;
	fail(opts:{formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean}, ...args: any[]): void;

	fail(...args: any[]) {
		this.impl.fail.apply(this.impl, args);
	}

	beginCommand(action:() => void, printHelpCommand: () => void) {
		throw new Error("not supported");
	}

	verifyHeap(message: string): void {

	}
}

export class OpenerStub implements IOpener {
	open(filename: string): void {}
}

export class LoginManager implements ILoginManager {
	basicLogin(userName: string, password: string): IFuture<void> {
		return undefined;
	}

	login(): IFuture<void> {
		return undefined;
	}

	logout(): IFuture<void> {
		return undefined;
	}

	isLoggedIn(): IFuture<boolean> {
		return Future.fromResult(false);
	}

	ensureLoggedIn(): IFuture<void> {
		return undefined;
	}
}