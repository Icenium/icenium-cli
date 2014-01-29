///<reference path="../.d.ts"/>
"use strict";

import fs = require("fs");
import path = require("path");
import util = require("util");

export class HelpCommand implements ICommand {
	constructor(private logger: ILogger) {
	}

	public execute(args: string[]): void {
		var topic: string;
		if (args.length == 0) {
			topic = "";
		} else {
			topic = args[0];
		}

		fs.readFile(path.join(__dirname, "../../resources/help.txt"), "utf8", (err, helpContent) => {
			if (err) {
				throw err;
			}

			var pattern = util.format("--\\[%s\\]--((.|[\\r\\n])+?)--\\[/\\]--", topic);
			var regex = new RegExp(pattern);

			var match = regex.exec(helpContent);
			if (match) {
				console.log(match[1].trim());
			} else {
				this.logger.fatal("Unknown help topic '%s'", topic);
			}
		});
	}
}
$injector.registerCommand("help", HelpCommand);