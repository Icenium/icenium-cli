///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import Future = require("fibers/future");
var _ = <UnderscoreStatic> require("underscore");

export class FileSystem implements IFileSystem {
	private _unlink = Future.wrap<void>(fs.unlink);
	private _stat = Future.wrap(fs.stat);
	private _readFile = Future.wrap(fs.readFile);
	private _writeFile = Future.wrap<void>(fs.writeFile);

	public exists(path: string): IFuture<boolean> {
		var future = new Future<boolean>();
		fs.exists(path, (exists: boolean) => future.return(exists));
		return future;
	}

	public deleteFile(path: string): IFuture<void> {
		return this._unlink(path);
	}

	public getFileSize(path: string): IFuture<number> {
		return ((): number => {
			var stat = this.stat(path).wait();
			return stat.size;
		}).future<number>()();
	}

	public futureFromEvent(eventEmitter: any, event: string): IFuture<any> {
		var future = new Future();
		eventEmitter.once(event, () => {
			var args = _.toArray(arguments);
			switch (args.length) {
				case 0:
					future.return();
					break;
				case 1:
					future.return(args[0]);
					break;
				default:
					future.return(args);
					break;
			}
		});
		eventEmitter.once("error", function(err) {
			future.throw(err);
		})
		return future;
	}

	public createDirectory(path:string): IFuture<void> {
		var future = new Future<void>();
		(<any> require("mkdirp"))(path, function(err: Error) {
			if (err) {
				future.throw(err);
			} else {
				future.return();
			}
		})
		return future;
	}

	public readFile(filename: string): IFuture<NodeBuffer> {
		return <IFuture<NodeBuffer>> this._readFile(filename);
	}

	public readText(filename: string, encoding?: string): IFuture<string> {
		return <IFuture<string>> this._readFile(filename, {encoding: encoding || "utf8"});
	}

	public readJson(filename: string, encoding?: string): IFuture<any> {
		return (() => {
			var data = this.readText(filename, encoding).wait();
			return JSON.parse(data);
		}).future()();
	}

	public writeFile(filename: string, data: any, encoding?: string): IFuture<void> {
		return this._writeFile(filename, data, {encoding: encoding});
	}

	public writeJson(filename: string, data: any, encoding?: string): IFuture<void> {
		return this.writeFile(filename, JSON.stringify(data), encoding);
	}

	public createReadStream(path: string, options?: {
		flags?: string;
		encoding?: string;
		fd?: string;
		mode?: number;
		bufferSize?: number;
	}): any {
		return fs.createReadStream(path, options);
	}

	public createWriteStream(path: string, options?: {
		flags?: string;
		encoding?: string;
		string?: string;
	}): any {
		return fs.createWriteStream(path, options);
	}

	private stat(path: string): IFuture<fs.Stats> {
		return this._stat(path);
	}
}
$injector.register("fs", FileSystem);
