(function() {
	"use strict";

	var log4js = require("log4js"),
		options = require("./options"),
		config = require("./config");

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

	module.exports = logger;

})();
