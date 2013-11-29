(function() {
	"use strict";

	var log4js = require("log4js"),
		options = require("./options"),
		config = require("./config");

	log4js.configure({
		appenders: [
			{
				type: "console",
				layout: {
					type: "messagePassThrough"
				}
			}
		]
	});

	var logger = log4js.getLogger();

	if (options.log !== undefined) {
		logger.setLevel(options.log);
	} else {
		logger.setLevel(config.DEBUG ? "TRACE" : "WARN");
	}

	module.exports = logger;

})();
