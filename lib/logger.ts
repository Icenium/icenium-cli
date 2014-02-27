///<reference path=".d.ts"/>
"use strict";

import log4js = require("log4js");
import util = require("util");
var options:any = require("./options");

var $config = $injector.resolve("config");
var appenders = [];

if (!$config.CI_LOGGER) {
	appenders.push({
		type: "console",
		layout: {
			type: "messagePassThrough"
		}
	});
}

log4js.configure({appenders: appenders});

var log4jsLogger = log4js.getLogger();

if (options.log !== undefined) {
	log4jsLogger.setLevel(options.log);
} else {
	log4jsLogger.setLevel($config.DEBUG ? "TRACE" : "INFO");
}

export class Logger implements ILogger {
	setLevel(level: string): void {
		log4jsLogger.setLevel(level);
	}

	fatal(...args): void {
		log4jsLogger.fatal.apply(log4jsLogger, args);
	}

	error(...args): void {
		log4jsLogger.error.apply(log4jsLogger, args);
	}

	warn(...args): void {
		log4jsLogger.warn.apply(log4jsLogger, args);
	}

	info(...args): void {
		log4jsLogger.info.apply(log4jsLogger, args);
	}

	debug(...args): void {
		log4jsLogger.debug.apply(log4jsLogger, args);
	}

	trace(...args): void {
		log4jsLogger.trace.apply(log4jsLogger, args);
	}

	out(...args): void {
		console.log(util.format.apply(null, args));
	}
}
$injector.register("logger", Logger);

// This should be deleted after all code that uses it is refactored
export function fatal(...args): void {
	log4jsLogger.fatal.apply(log4jsLogger, args);
}

export function error(...args): void {
	log4jsLogger.error.apply(log4jsLogger, args);
}

export function warn(...args): void {
	log4jsLogger.warn.apply(log4jsLogger, args);
}

export function info(...args): void {
	log4jsLogger.info.apply(log4jsLogger, args);
}

export function debug(...args): void {
	log4jsLogger.debug.apply(log4jsLogger, args);
}

export function trace(...args): void {
	log4jsLogger.trace.apply(log4jsLogger, args);
}
