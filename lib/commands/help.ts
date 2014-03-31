///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

export class HelpCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $injector: IInjector,
		private $errors: IErrors,
		private $fs: IFileSystem) {}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var topic = (args[0] || "").toLowerCase();
			if (topic === "help") {
				topic = "";
			}

			var helpContent = this.$fs.readText(path.join(__dirname, "../../resources/help.txt")).wait();

			var pattern = util.format("--\\[%s\\]--((.|[\\r\\n])+?)--\\[/\\]--", topic);
			var regex = new RegExp(pattern);

			var match = regex.exec(helpContent);
			if (match) {
				var helpText = match[1].trim();

				var substitutionPoint;
				while (substitutionPoint = helpText.match(/#{([^.]+)\.([^}]+)}/)) {
					this.$logger.trace(substitutionPoint);

					var module = this.$injector.resolve(substitutionPoint[1]);
					var data = module[substitutionPoint[2]].apply(module) || "";

					var pointStart = substitutionPoint.index;
					var pointEnd = pointStart + substitutionPoint[0].length;
					helpText = helpText.substr(0, pointStart) + data + helpText.substr(pointEnd);
				}

				this.$logger.out(helpText);
			} else {
				this.$errors.fail({ formatStr: "Unknown help topic '%s'", suppressCommandHelp: true }, topic);
			}
		}).future<void>()();
	}
}
$injector.registerCommand(["help", "/?"], HelpCommand);
