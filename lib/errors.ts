///<reference path=".d.ts"/>

import util = require("util");
import path = require("path");
import _ = require("underscore");

function Exception() {}
Exception.prototype = new Error();

function resolveCallStack(stack: string): string {
	var stackLines: string[]= stack.split("\n");
	var parsed = _.map(stackLines, (line): any => {
		var match = line.match(/^\s*at ([^(]*)\((.*?):([0-9]+):([0-9]+)\)$/);
		if (match) {
			return match;
		}

		match = line.match(/^\s*at (.*?):([0-9]+):([0-9]+)$/);
		if (match) {
			match.splice(1, 0, "[anonymous]");
			return match;
		}

		return line;
	});

	var SourceMapConsumer = require("../vendor/source-map").sourceMap.SourceMapConsumer;
	var fs = require("fs");

	var remapped = _.map(parsed, (parsedLine) => {
		if (_.isString(parsedLine)) {
			return parsedLine;
		}

		var functionName = parsedLine[1];
		var fileName = parsedLine[2];
		var line = +parsedLine[3];
		var column = +parsedLine[4];

		var mapFileName = fileName + ".map";
		if (!fs.existsSync(mapFileName)) {
			return parsedLine.input;
		}

		var mapData = JSON.parse(fs.readFileSync(mapFileName).toString());

		var consumer = new SourceMapConsumer(mapData);
		var sourcePos = consumer.originalPositionFor({line: line, column: column});

		var source = path.join(path.dirname(fileName), sourcePos.source);

		return util.format("    at %s (%s:%s:%s)", functionName, source, sourcePos.line, sourcePos.column);
	});

	return remapped.join("\n");
}

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
			this.$logger.fatal(this.$config.DEBUG
				? resolveCallStack(ex.stack)
				: "\x1B[34m" + ex.message + "\x1B[0m");

			if (!ex.suppressCommandHelp) {
				printCommandHelp();
			}

			process.exit(_.isNumber(ex.errorCode) ? ex.errorCode : ErrorCodes.UNKNOWN);
		}
	}
}
$injector.register("errors", Errors);
