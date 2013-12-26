///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import path = require("path");
import util = require("util");
import log = require("./log");

export function printHelp(topic) {
	if (!topic) {
		topic = "";
	}

	fs.readFile(path.join(__dirname, "../resources/help.txt"), "utf8", function(err, helpContent) {
		if (err) {
			throw err;
		}

		var pattern = util.format("--\\[%s\\]--((.|[\\r\\n])+?)--\\[/\\]--", topic);
		var regex = new RegExp(pattern);

		var match = regex.exec(helpContent);
		if (match) {
			console.log(match[1].trim());
		} else {
			log.fatal("Unknown help topic '%s'", topic);
		}
	});
}
