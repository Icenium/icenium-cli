///<reference path=".d.ts"/>

import Future = require("fibers/future");
import child_process = require("child_process");

export class ChildProcess implements IChildProcess {
	constructor(private $logger: ILogger) {}

	private _exec = Future.wrap((command: string, callback: (error: any, stdout: NodeBuffer) => void) => {
		return child_process.exec(command, callback);
	});

	public exec(command: string): IFuture<any> {
		this.$logger.debug("exec: %s", command);
		return this._exec(command);
	}

	public spawn(command: string, args?: string[], options?: any): any {
		return child_process.spawn(command, args, options);
	}
}
$injector.register("childProcess", ChildProcess);