import * as path from "path";
import yok = require("../lib/common/yok");
import helpCommand = require("../lib/common/commands/help");
import stubs = require("./stubs");
import Future = require("fibers/future");
import microTemplateServiceLib = require("../lib/common/services/micro-templating-service");
import dynamicHelpProviderLib = require("../lib/dynamic-help-provider");
import htmlHelpServiceLib = require("../lib/common/services/html-help-service");
import optionsLib = require("../lib/options");
import hostInfoLib = require("../lib/common/host-info");

let assert = require("chai").assert;

let createTestInjector = (opts?: { isProjectTypeResult: boolean; isPlatformResult: boolean }): IInjector => {
	let injector = new yok.Yok();
	let logger = new stubs.LoggerStub();
	injector.register("hostInfo", hostInfoLib.HostInfo);
	injector.register("staticConfig", {
		helpTextPath: path.join(__dirname, "../resources/help.txt")
	});
	injector.register("errors", stubs.ErrorsStub);
	injector.register("options", optionsLib.Options);
	let $options = injector.resolve("options");
	$options.help = true;
	injector.register("logger", logger);

	opts = opts || { isPlatformResult: true, isProjectTypeResult: true };

	injector.register("dynamicHelpProvider", dynamicHelpProviderLib.DynamicHelpProvider);
	injector.register("dynamicHelpService", {
		isProjectType: (...args: string[]): IFuture<boolean> => { return Future.fromResult(opts.isProjectTypeResult); },
		isPlatform: (...args: string[]): boolean => { return opts.isPlatformResult; },
		getLocalVariables: (): IFuture<IDictionary<any>> => {
			return (() => {
				let localVariables: IDictionary<any> = {};
				localVariables["isCordova"] = opts.isProjectTypeResult;
				localVariables["isNativeScript"] = opts.isProjectTypeResult;
				localVariables["isLinux"] = opts.isPlatformResult;
				localVariables["isWindows"] = opts.isPlatformResult;
				localVariables["isMacOS"] = opts.isPlatformResult;
				return localVariables;
			}).future<IDictionary<any>>()();
		}
	});
	injector.register("microTemplateService", microTemplateServiceLib.MicroTemplateService);
	injector.register("htmlHelpService", htmlHelpServiceLib.HtmlHelpService);
	injector.register("opener", {
		open(target: string, appname?: string): void {/* mock */}
	});
	injector.register("commandsServiceProvider", {
		getDynamicCommands: (): IFuture<string[]> => {
			return Future.fromResult(<string[]>[]);
		}
	});

	injector.registerCommand("foo", {});

	return injector;
};

describe("help", () => {
	it("processes substitution points",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command: () => "woot"
		});

		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <%= #{module.command} %> bla")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		assert.isTrue(injector.resolve("logger").output.indexOf("bla woot bla") >= 0);
	});

	it("process correctly if construction with dynamicCall returning false",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command: () => false
		});

		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (#{module.command}) { %> secondBla <% } %>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla") >= 0);
		assert.isTrue(output.indexOf("secondBla") < 0);
	});

	it("process correctly if construction with dynamicCall returning true",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command: () => true
		});

		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (#{module.command}) { %>secondBla<% } %>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla") >= 0);
		assert.isTrue(output.indexOf("secondBla") > 0);
		assert.isTrue(output.indexOf("bla secondBla") >= 0);
	});

	it("process correctly if construction returning false",() => {
		let injector = createTestInjector();

		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (false) { %> secondBla <% } %>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla") >= 0);
		assert.isTrue(output.indexOf("secondBla") < 0);
		assert.isTrue(output.indexOf("bla secondBla") < 0);
	});

	it("process correctly if construction returning true",() => {
		let injector = createTestInjector();
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (true) { %>secondBla<% } %>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla") >= 0);
		assert.isTrue(output.indexOf("secondBla") > 0);
		assert.isTrue(output.indexOf("bla secondBla") >= 0);
	});

	it("process correctly is* projectType variables when they are true",() => {
		let injector = createTestInjector();
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (isCordova) { %>isCordova<% } %> <% if(isNativeScript) { %>isNativeScript<%}%>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isCordova isNativeScript") >= 0);
	});

	it("process correctly is* projectType variables when they are false",() => {
		let injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (isCordova) { %>isCordova<% } %> <% if(isNativeScript) { %>isNativeScript<%}%>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isCordova isNativeScript") < 0);
		assert.isTrue(output.indexOf("isCordova") < 0);
		assert.isTrue(output.indexOf("isNativeScript") < 0);
		assert.isTrue(output.indexOf("bla") >= 0);
	});

	it("process correctly is* platform variables when they are true",() => {
		let injector = createTestInjector();
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (isLinux) { %>isLinux<% } %> <% if(isWindows) { %>isWindows<%}%> <%if(isMacOS) {%>isMacOS<%}%>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isLinux isWindows isMacOS") >= 0);
	});

	it("process correctly is* platform variables when they are false",() => {
		let injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (isLinux) { %>isLinux<% } %> <% if(isWindows) { %>isWindows<%}%> <%if(isMacOS) {%>isMacOS<%}%>")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isLinux isWindows isMacOS") < 0);
		assert.isTrue(output.indexOf("isLinux") < 0);
		assert.isTrue(output.indexOf("isWindows") < 0);
		assert.isTrue(output.indexOf("isMacOS") < 0);
		assert.isTrue(output.indexOf("bla") >= 0);
	});

	it("process correctly multiple if statements with local variables (all are true)",() => {
		let injector = createTestInjector();
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			// all variables must be true
			readText: () => Future.fromResult("bla <% if (isLinux) { %><% if(isCordova) {%>isLinux and isCordova <% } %><% } %>end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isLinux and isCordova end") >= 0);
	});

	it("process correctly multiple if statements with local variables (all are false)",() => {
		let injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: false });
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			// all variables must be false
			readText: () => Future.fromResult("bla <% if (isLinux) { %><% if(isCordova) {%>isLinux and isCordova <% } %><% } %>end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();

		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isLinux and isCordova end") < 0);
		assert.isTrue(output.indexOf("isLinux") < 0);
		assert.isTrue(output.indexOf("isCordova") < 0);
		assert.isTrue(output.indexOf("bla end") >= 0);
	});

	it("process correctly multiple if statements with local variables (isProjectType is false, isPlatform is true)",() => {
		let injector = createTestInjector({ isProjectTypeResult: false, isPlatformResult: true });
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (isLinux) { %>isLinux <% if(isCordova) {%>isCordova <% } %><% } %>end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla isLinux end") >= 0);
	});

	it("process correctly multiple if statements with dynamicCalls (all are true)",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command1: () => true,
			command2: () => true
		});
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (#{module.command1}) { %>command1<% if(#{module.command2}) {%> and command2 <% } %><% } %>end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla command1 and command2 end") >= 0);
	});

	it("process correctly multiple if statements with dynamicCalls (all are false)",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command1: () => false,
			command2: () => false
		});
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (#{module.command1}) { %>command1<% if(#{module.command2}) {%> and command2 <% } %><% } %>end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla command1 and command2 end") < 0);
		assert.isTrue(output.indexOf("command1") < 0);
		assert.isTrue(output.indexOf("command2") < 0);
		assert.isTrue(output.indexOf("bla end") >= 0);
	});

	it("process correctly multiple if statements with dynamicCalls (different result)",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command1: () => true,
			command2: () => false,
			command3: () => false
		});
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <% if (#{module.command1}) { %>command1 <% if(#{module.command2}) {%> and command2 <% if(#{module.command3}) { %>and command3 <% } %> <% } %><% } %>end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla command1 end") >= 0);
		assert.isTrue(output.indexOf("command2") < 0);
		assert.isTrue(output.indexOf("command3") < 0);
	});

	it("process correctly multiple dynamicCalls",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command1: () => "command1",
			command2: () => "command2",
			command3: () => "command3"
		});
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("bla <%= #{module.command1}%> <%= #{module.command2} %> <%= #{module.command3} %> end")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla command1 command2 command3 end") >= 0);
	});

	it("process correctly dynamicCalls with parameters",() => {
		let injector = createTestInjector();
		injector.register("module", {
			command1: (...args:string[]) => args.join(" ")
		});
		injector.register("fs", {
			enumerateFilesInDirectorySync: (path: string) => ["foo.md"],
			readText: () => Future.fromResult("--[foo]-- bla <%= #{module.command1(param1, param2)}%> end--[/]--")
		});

		let help = injector.resolve(helpCommand.HelpCommand);
		help.execute(["foo"]).wait();
		let output = injector.resolve("logger").output;
		assert.isTrue(output.indexOf("bla param1 param2 end") >= 0);
	});
});
