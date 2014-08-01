///<reference path=".d.ts"/>

"use strict";
import path = require("path");
import yok = require("../lib/common/yok");
import helpCommand = require("../lib/common/commands/help");
import stubs = require("./stubs");
import Future = require("fibers/future");

var assert = require("chai").assert;

describe("help", () => {
	it("processes substitution points", () => {
		var injector = new yok.Yok();
		var logger = new stubs.LoggerStub();
		injector.register("logger", logger);
		injector.register("errors", stubs.ErrorsStub);
		injector.register("injector", injector);
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla #{module.command} bla --[/]--")
		});
		injector.register("module", {
			command: () => "woot"
		});
		injector.register("config", {
			helpTextPath: path.join(__dirname, "../resources/help.txt")
		});

		var help = injector.resolve(helpCommand.HelpCommand);

		help.execute(["foo"]).wait();

		assert.equal(logger.output, "bla woot bla\n");
	});
});
