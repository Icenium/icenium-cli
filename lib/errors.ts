///<reference path=".d.ts"/>

import util = require("util");
import _ = require("underscore");

function Exception() {}
Exception.prototype = new Error();

export class Errors implements IErrors {
	constructor(
		private $logger: ILogger,
		private $config) {}

	fail(optsOrFormatStr: any, ...args: any[]): void {
		var opts = optsOrFormatStr;
		if (_.isString(opts)) {
			opts = {
				formatStr: opts
			};
		}

		args.unshift(opts.formatStr);

		var exception: any = new Exception();
		exception.name = opts.name || "Exception";
		exception.message = util.format.apply(null, args);
		exception.stack = new Error(exception.message).stack;
		exception.errorCode = opts.errorCode || ErrorCodes.UNKNOWN;
		exception.suppressCommandHelp = opts.suppressCommandHelp;

		throw exception;
	}

	beginCommand(action: () => any, printCommandHelp: () => void): any {
		try {
			return action();
		} catch (ex) {
			this.$logger.fatal(this.$config.DEBUG ? ex.stack : "\x1B[34m" + ex.message + "\x1B[0m");

			if (!ex.suppressCommandHelp) {
				printCommandHelp();
			}

			process.exit(_.isNumber(ex.errorCode) ? ex.errorCode : ErrorCodes.UNKNOWN);
		}
	}
}
$injector.register("errors", Errors);
