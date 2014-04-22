///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import unzip = require("unzip");
import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import rimraf = require("rimraf");
import helpers = require("./helpers");

export class FileSystem implements IFileSystem {
	private _stat = Future.wrap(fs.stat);
	private _readFile = Future.wrap(fs.readFile);
	private _deleteDirectory = Future.wrap(rimraf);
	private _writeFile = Future.wrap<void>(fs.writeFile);
	private _readdir = Future.wrap(fs.readdir);
	private _chmod = Future.wrap(fs.chmod);

//TODO: try 'archiver' module for zipping
	public zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): IFuture<void> {
		//we are resolving it here instead of in the constructor, because config has dependency on file system and config shouldn't require logger
		var $logger = $injector.resolve("logger");
		var zipstream = require("zipstream");
		var zip = zipstream.createZip({ level: 9 });
		var outFile = fs.createWriteStream(zipFile);
		zip.pipe(outFile);

		var result = new Future<void>();
		outFile.on("error", (err) => result.throw(err));

		var fileIdx = -1;
		var zipCallback = function () {
			fileIdx++;
			if (fileIdx < files.length) {
				var file = files[fileIdx];

				var relativePath = zipPathCallback(file);
				relativePath = relativePath.replace(/\\/g, "/");
				$logger.trace("zipping as '%s' file '%s'", relativePath, file);

				zip.addFile(
					fs.createReadStream(file),
					{ name: relativePath },
					zipCallback);
			} else {
				outFile.on("finish", function () {
					result.return();
				});

				zip.finalize(function (bytesWritten) {
					$logger.debug("zipstream: %d bytes written", bytesWritten);
					outFile.end();
				});
			}
		};
		zipCallback();

		return result;
	}

	public unzip(zipFile: string, destinationDir: string): IFuture<void> {
		if (helpers.isDarwin()) {
			var $childProcess = $injector.resolve("$childProcess");
			var unzipProc = $childProcess.spawn('unzip', [zipFile, '-d', destinationDir],
				{ stdio: "ignore", detached: true });
			return this.futureFromEvent(unzipProc, "close");
		}
		else {
			return this.futureFromEvent(
				this.createReadStream(zipFile)
					.pipe(unzip.Extract({ path: destinationDir })), "close");
		}
	}

	public exists(path: string): IFuture<boolean> {
		var future = new Future<boolean>();
		fs.exists(path, (exists: boolean) => future.return(exists));
		return future;
	}

	public deleteFile(path: string): IFuture<void> {
		var future = new Future<void>();
		fs.unlink(path, function(err) {
			if (err && err.code !== "ENOENT") {  // ignore "file doesn't exist" error
				future.throw(err);
			} else {
				future.return();
			}
		})
		return future;
	}

	public deleteDirectory(directory: string): IFuture<void> {
		return (() => {
			this._deleteDirectory(directory).wait();
		}).future<void>()();
		
	}

	public getFileSize(path: string): IFuture<number> {
		return ((): number => {
			var stat = this.getFsStats(path).wait();
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

	public readDirectory(path: string): IFuture<string[]> {
		return this._readdir(path);
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
			if(data) {
				return JSON.parse(data);
			}
			return null;
		}).future()();
	}

	public writeFile(filename: string, data: any, encoding?: string): IFuture<void> {
		return this._writeFile(filename, data, {encoding: encoding});
	}

	public writeJson(filename: string, data: any, space?: string, encoding?: string): IFuture<void> {
		return this.writeFile(filename, JSON.stringify(data, null, space), encoding);
	}

	public copyFile(sourceFileName: string, destinationFileName: string): IFuture<void> {
		return (() => {
			this.createDirectory(path.dirname(destinationFileName)).wait();
			var source = this.createReadStream(sourceFileName);
			var target = this.createWriteStream(destinationFileName);
			source.pipe(target);
			this.futureFromEvent(target, "finish").wait();
		}).future<void>()();
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

	public chmod(path: string, mode: number): IFuture<any> {
		return this._chmod(path, mode);
    }

	public getFsStats(path: string): IFuture<fs.Stats> {
		return this._stat(path);
	}

	public getUniqueFileName(baseName: string): IFuture<string> {
		return ((): string => {
			if (!this.exists(baseName).wait()) {
				return baseName;
			}
			var extension = path.extname(baseName);
			var prefix = path.basename(baseName, extension);

			for (var i = 2; ; ++i) {
				var numberedName = prefix + i + extension;
				if (!this.exists(numberedName).wait()) {
					return numberedName;
				}
			}
		}).future<string>()();
	}
}
$injector.register("fs", FileSystem);
