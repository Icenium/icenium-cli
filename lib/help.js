"use strict";

(function(){
	var fs = require("fs"),
		path = require("path"),
		util = require("util"),
		log = require("./log");

	function printHelp(topic) {
		if (!topic) {
			topic = "";
		}

		fs.readFile(path.join(__dirname, "../resources/help.txt"), function(err, helpContent) {
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

	exports.printHelp = printHelp;
})();
