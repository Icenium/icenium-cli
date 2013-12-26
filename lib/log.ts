///<reference path=".d.ts"/>

"use strict";

import log4js = require("log4js");
import config = require("./config");
var options:any = require("./options");

var appenders = [];

if (!config.CI_LOGGER) {
	appenders.push({
		type: "console",
		layout: {
			type: "messagePassThrough"
		}
	});
}

log4js.configure({appenders: appenders});

var logger = log4js.getLogger();

if (options.log !== undefined) {
	logger.setLevel(options.log);
} else {
	logger.setLevel(config.DEBUG ? "TRACE" : "INFO");
}

export function fatal(...args): void {
	logger.fatal.apply(logger, args);
}

export function error(...args): void {
	logger.error.apply(logger, args);
}

export function warn(...args): void {
	logger.warn.apply(logger, args);
}

export function info(...args): void {
	logger.info.apply(logger, args);
}

export function debug(...args): void {
	logger.debug.apply(logger, args);
}

export function trace(...args): void {
	logger.trace.apply(logger, args);
}
