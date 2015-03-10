///<reference path=".d.ts"/>

"use strict";
import path = require("path");
import yok = require("../lib/common/yok");
import helpCommand = require("../lib/common/commands/help");
import stubs = require("./stubs");
import Future = require("fibers/future");
import microTemplateServiceLib = require("../lib/common/services/micro-templating-service");
import dynamicHelpServiceLib = require("../lib/common/services/dynamic-help-service");
import dynamicHelpProviderLib = require("../lib/dynamic-help-provider");

var assert = require("chai").assert;

var createTestInjector = (options?: { isProjectTypeResult: boolean; isPlatformResult: boolean }): IInjector => {
	var injector = new yok.Yok();
	var logger = new stubs.LoggerStub();
	injector.register("logger", logger);
	injector.register("errors", stubs.ErrorsStub);
	options = options || { isPlatformResult: true, isProjectTypeResult: true };
	injector.register("dynamicHelpProvider", dynamicHelpProviderLib.DynamicHelpProvider);
	injector.register("dynamicHelpService", {
		isProjectType: (...args: string[]): IFuture<boolean> => { return Future.fromResult(options.isProjectTypeResult); },
		isPlatform: (...args: string[]): boolean => { return options.isPlatformResult; },
		getLocalVariables: (): IFuture<IDictionary<any>> => {
			return (() => {
				var localVariables: IDictionary<any> = {};
				localVariables["isMobileWebsite"] = options.isProjectTypeResult;
				localVariables["isCordova"] = options.isProjectTypeResult;
				localVariables["isNativeScript"] = options.isProjectTypeResult;
				localVariables["isLinux"] = options.isPlatformResult;
				localVariables["isWindows"] = options.isPlatformResult;
				localVariables["isMacOS"] = options.isPlatformResult;
				return localVariables;
			}).future<IDictionary<any>>()();
		}
	});
	injector.register("microTemplateService", microTemplateServiceLib.MicroTemplateService);
	
	injector.register("staticConfig", {
		helpTextPath: path.join(__dirname, "../resources/help.txt")
	});

	return injector;
}

describe("help", () => {
	it("processes substitution points",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command: () => "woot"
		});

		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <%= #{module.command} %> bla --[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla woot bla\n");
	});

	it("process correctly if construction with dynamicCall returning false",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command: () => false
		});

		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (#{module.command}) { %> bla <% } %>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla \n");
	});

	it("process correctly if construction with dynamicCall returning true",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command: () => true
		});

		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (#{module.command}) { %>bla<% } %>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla bla\n");
	});

	it("process correctly if construction returning false",() => {
		var injector = createTestInjector();
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (false) { %> bla <% } %>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla \n");
	});

	it("process correctly if construction returning true",() => {
		var injector = createTestInjector();
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (true) { %>bla<% } %>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla bla\n");
	});

	it("process correctly is* projectType variables when they are true",() => {
		var injector = createTestInjector();
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (isCordova) { %>isCordova<% } %> <% if(isNativeScript) { %>isNativeScript<%}%> <%if(isMobileWebsite) {%>isMobileWebsite<%}%>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla isCordova isNativeScript isMobileWebsite\n");
	});

	it("process correctly is* projectType variables when they are false",() => {
		var injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (isCordova) { %>isCordova<% } %> <% if(isNativeScript) { %>isNativeScript<%}%> <%if(isMobileWebsite) {%>isMobileWebsite<%}%>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla   \n");
	});

	it("process correctly is* platform variables when they are true",() => {
		var injector = createTestInjector();
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (isLinux) { %>isLinux<% } %> <% if(isWindows) { %>isWindows<%}%> <%if(isMacOS) {%>isMacOS<%}%>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla isLinux isWindows isMacOS\n");
	});

	it("process correctly is* platform variables when they are false",() => {
		var injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (isLinux) { %>isLinux<% } %> <% if(isWindows) { %>isWindows<%}%> <%if(isMacOS) {%>isMacOS<%}%>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla   \n");
	});

	it("process correctly is* platform variables when they are false",() => {
		var injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (isLinux) { %>isLinux<% } %> <% if(isWindows) { %>isWindows<%}%> <%if(isMacOS) {%>isMacOS<%}%>--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla   \n");
	});

	it("process correctly multiple if statements with local variables (all are true)",() => {
		var injector = createTestInjector();
		injector.register("fs", {
			// all variables must be true
			readText: () => Future.fromResult("--[foo]-- bla <% if (isLinux) { %><% if(isCordova) {%>isLinux and isCordova <% } %><% } %>end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla isLinux and isCordova end\n");
	});

	it("process correctly multiple if statements with local variables (all are false)",() => {
		var injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			// all variables must be false
			readText: () => Future.fromResult("--[foo]-- bla <% if (isLinux) { %><% if(isCordova) {%>isLinux and isCordova <% } %><% } %>end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla end\n");
	});

	it("process correctly multiple if statements with local variables (isProjectType is false, isPlatform is true)",() => {
		var injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: true });
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (isLinux) { %>isLinux <% if(isCordova) {%>isCordova <% } %><% } %>end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla isLinux end\n");
	});

	it("process correctly multiple if statements with dynamicCalls (all are true)",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command1: () => true,
			command2: () => true
		});
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (#{module.command1}) { %>command1<% if(#{module.command2}) {%> and command2 <% } %><% } %>end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla command1 and command2 end\n");
	});

	it("process correctly multiple if statements with dynamicCalls (all are false)",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command1: () => false,
			command2: () => false
		});
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (#{module.command1}) { %>command1<% if(#{module.command2}) {%> and command2 <% } %><% } %>end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla end\n");
	});

	it("process correctly multiple if statements with dynamicCalls (different result)",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command1: () => true,
			command2: () => false,
			command3: () => false
		});
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <% if (#{module.command1}) { %>command1 <% if(#{module.command2}) {%> and command2 <% if(#{module.command3}) { %>and command3 <% } %> <% } %><% } %>end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla command1 end\n");
	});

	it("process correctly multiple dynamicCalls",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command1: () => "command1",
			command2: () => "command2",
			command3: () => "command3"
		});
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <%= #{module.command1}%> <%= #{module.command2} %> <%= #{module.command3} %> end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla command1 command2 command3 end\n");
	});

	it("process correctly dynamicCalls with parameters",() => {
		var injector = createTestInjector();
		injector.register("module", {
			command1: (...args:string[]) => args.join(" ")
		});
		injector.register("fs", {
			readText: () => Future.fromResult("--[foo]-- bla <%= #{module.command1(param1, param2)}%> end--[/]--")
		});

		var help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		assert.equal(injector.resolve("logger").output, "bla param1 param2 end\n");
	});
});
