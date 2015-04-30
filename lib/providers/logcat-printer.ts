///<reference path="../.d.ts"/>
"use strict";

export class LogcatPrinter implements Mobile.ILogcatPrinter {
	private static LINE_REGEX = /.\/(.+?)\s*\(\s*(\d+?)\): (.*)/;

	constructor(private $logger: ILogger) { }

	public print(lineText: string): void {
		var log = this.getConsoleLogFromLine(lineText);
		if(log) {
			if(log.tag) {
				this.$logger.out("%s: %s", log.tag, log.message);
			} else {
				this.$logger.out(log.message);
			}
		}
	}

	private getConsoleLogFromLine(lineText: String): any {
		var acceptedTags = ["chromium", "Web Console", "JS"];
		//sample line is "I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48"
		var match = lineText.match(LogcatPrinter.LINE_REGEX);
		if(match) {
			if(acceptedTags.indexOf(match[1]) !== -1) {
				return {tag: match[1], message: match[3]};
			}
		} else if(_.any(acceptedTags, (tag: string) => { return lineText.indexOf(tag) !== -1; })) {
			return {message: match[3]};
		}
		return null;
	}
}
$injector.register("logcatPrinter", LogcatPrinter);