///<reference path=".d.ts"/>

"use strict";

import yok = require("../lib/yok");
import helpCommand = require("../lib/commands/help");
import stubs = require("./stubs");
import Future = require("fibers/future");

var assert = require("chai").assert;

describe("help", function() {
	it("processes substitution points", function() {
		var injector = new yok.Yok();
		var logger = new stubs.LoggerStub();
		injector.register("logger", logger);
		injector.register("errors", stubs.ErrorsStub);
		injector.register("injector", injector);
		injector.register("fs", {
			readText: function() {
				return Future.fromResult("--[foo]-- bla #{module.command} bla --[/]--");
			}
		});
		injector.register("module", {
			command: function() {
				return "woot";
			}
		});

		var help = injector.resolve(helpCommand.HelpCommand);

		help.execute(["foo"]).wait();

		assert.equal(logger.output, "bla woot bla\n");
	});
});
