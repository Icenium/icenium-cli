///<reference path="../.d.ts"/>
"use strict";

import fs = require("fs");
import path = require("path");
import util = require("util");

export class HelpCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem) {}

	public execute(args: string[]): IFuture<void> {
		return(() => {
			var topic: string;
			if (args.length == 0) {
				topic = "";
			} else {
				topic = args[0];
			}

			var helpContent = this.$fs.readText(path.join(__dirname, "../../resources/help.txt")).wait();

			var pattern = util.format("--\\[%s\\]--((.|[\\r\\n])+?)--\\[/\\]--", topic);
			var regex = new RegExp(pattern);

			var match = regex.exec(helpContent);
			if (match) {
				this.$logger.out(match[1].trim());
			} else {
				this.$errors.fail({ formatStr: "Unknown help topic '%s'", suppressCommandHelp: true }, topic);
			}
		}).future<void>()();
	}
}
$injector.registerCommand("help", HelpCommand);