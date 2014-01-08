///<reference path="../.d.ts"/>
"use strict";

import commands = require("./icommand");
import fs = require("fs");
import path = require("path");
import util = require("util");

module Commands {
	export class HelpCommandData implements commands.Commands.ICommandData {
		constructor(private topic: string = "") {}

		public get Topic() {
			return this.topic;
		}
	}

	export class HelpCommandDataFactory implements commands.Commands.ICommandDataFactory {
		public fromCliArguments(args: string[]): Commands.HelpCommandData {
			if (args.length == 0) {
				return new HelpCommandData();
			} else {
				return new HelpCommandData(args[0]);
			}
		}
	}
	global.$injector.register("helpCommandDataFactory", Commands.HelpCommandDataFactory);

	export class HelpCommand implements commands.Commands.ICommand<HelpCommandData> {
		constructor(private helpCommandDataFactory: Commands.HelpCommandDataFactory,
			private log: Interfaces.ILogger) {
		}

		public getDataFactory(): Commands.HelpCommandDataFactory {
			return this.helpCommandDataFactory;
		}

		public canExecute(data: HelpCommandData): boolean {
			return true;
		}

		public execute(data: HelpCommandData): void {
			fs.readFile(path.join(__dirname, "../../resources/help.txt"), "utf8", (err, helpContent) => {
				if (err) {
					throw err;
				}

				var pattern = util.format("--\\[%s\\]--((.|[\\r\\n])+?)--\\[/\\]--", data.Topic);
				var regex = new RegExp(pattern);

				var match = regex.exec(helpContent);
				if (match) {
					console.log(match[1].trim());
				} else {
					this.log.fatal("Unknown help topic '%s'", data.Topic);
				}
			});
		}
	}
	global.$injector.register("help", Commands.HelpCommand);
}