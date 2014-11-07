///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");
var testInjector = new yok.Yok();
import stubs = require("./stubs");
var commandsServiceFile = require("../lib/common/services/commands-service");
var configFile = require("../lib/config");
import util = require("util");
var assert = require("chai").assert;

class ErrorsNoFailStub implements IErrors {
	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) { throw new Error();}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return (() => {
			try {
				var result = action().wait();
			} catch(ex) {
				return false;
			}

			return result;
		}).future<boolean>()();
	}

	verifyHeap(message: string): void { }
}

export class LoggerStubWithErrorOnFatal implements ILogger {
	setLevel(level: string): void { }
	fatal(formatStr: string, ...args: string[]): void { throw new Error();}
	error(formatStr: string, ...args: string[]): void { }
	warn(formatStr: string, ...args: string[]): void { }
	info(formatStr: string, ...args: string[]): void { }
	debug(formatStr: string, ...args: string[]): void { }
	trace(formatStr: string, ...args: string[]): void { }

	public output = "";

	out(formatStr: string, ...args: string[]): void {
		args.unshift(formatStr);
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }
}

testInjector.register("config", configFile.Configuration);
testInjector.register("logger", LoggerStubWithErrorOnFatal);
testInjector.register("fs", stubs.FileSystemStub);
testInjector.register("errors", ErrorsNoFailStub);
testInjector.register("injector", testInjector);
testInjector.register("staticConfig", stubs.StaticConfig);
testInjector.register("hooksService", stubs.HooksService);
testInjector.register("commandsService", commandsServiceFile.CommandsService);
var commandsService = testInjector.resolve("commandsService");
var isCommandExecuted = false;

class MockCommandParameter implements ICommandParameter {
	constructor(mandatory: boolean) {
		this.mandatory = mandatory;
	}

	mandatory = false;
	validate(value: string): IFuture<boolean> {
		return (() => { return true; }).future<boolean>()();
	}
}

class MockInvalidCommandParameter implements ICommandParameter {
	constructor(mandatory: boolean) {
		this.mandatory = mandatory;
	}

	mandatory = false;
	validate(value: string): IFuture<boolean> {
		return (() => { return false; }).future<boolean>()();
	}
}

class MockCommandWithOneMandatoryParameter implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockCommandParameter(true)];
}
testInjector.registerCommand("commandWithOneMandatArg", MockCommandWithOneMandatoryParameter);

class MockCommandWithOneNonMandatoryParameter implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockCommandParameter(false)];
}
testInjector.registerCommand("commandWithOneNonMandatArg", MockCommandWithOneNonMandatoryParameter);

class MockCommandWithSomeMandatoryParameteres implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockCommandParameter(true), new MockCommandParameter(true)];
}
testInjector.registerCommand("commandWithSomeMandatArgs", MockCommandWithSomeMandatoryParameteres);

class MockCommandWithoutParameters implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [];
}
testInjector.registerCommand("commandWithoutArgs", MockCommandWithoutParameters);

class MockCommandWithInvalidParameters implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockInvalidCommandParameter(true)];
}
testInjector.registerCommand("commandWithInvalidArgs", MockCommandWithInvalidParameters);

class MockCommandWithCanExecuteImplemented implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(args[0] === "true") {
				return true;
			}

			return false;
		}).future<boolean>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockInvalidCommandParameter(true)];
}
testInjector.registerCommand("commandWithCanExecute", MockCommandWithCanExecuteImplemented);

describe("commands service", () => {
	describe("tryExecuteCommand", () => {
		it("calls executeCommand when command name is valid", () => {
			isCommandExecuted = false;
			commandsService.executeCommandUnchecked = (): IFuture<boolean> => {
				return (() => {
					isCommandExecuted = true;
					return false;
				}).future<boolean>()();
			}

			commandsService.tryExecuteCommand("commandWithoutArgs", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not call executeCommand when command name is invalid", () => {
			isCommandExecuted = false;
			commandsService.executeCommandUnchecked = (): IFuture<boolean> => {
				return (() => {
					isCommandExecuted = true;
					return false;
				}).future<boolean>()();
			}

			commandsService.tryExecuteCommand("InvalidCommandName", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command when it has valid mandatory arguments", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithOneMandatArg", ["simple string param"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it has missing mandatory argument", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithOneMandatArg", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command when it doesn't accept arguments and there aren't passed any", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithoutArgs", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it doesn't accept arguments, but there are passed some", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithoutArgs", ["argument"]).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("does not execute command when it accepts arguments and the validation method of one of them is failing", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithInvalidArgs", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command when it has some nonmandatory arguments and there aren't passed any", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithOneNonMandatArg", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("executes command when it has some mandatory arguments and all of them are passed", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithSomeMandatArgs", ["param1", "param2"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it has some mandatory arguments and not all of them are passed", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithSomeMandatArgs", ["param1"]).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("does not call validateMandatoryParams when command implements canExecute method.", () => {
			isCommandExecuted = false;
			var isValidateCommandArgumentsCalled = false;
			commandsService.validateCommandArguments = () => {
				isValidateCommandArgumentsCalled = true;
			};

			// Assert validateCommandArguments is not called when canExecute returns true
			commandsService.tryExecuteCommand("commandWithCanExecute", ["true"]).wait();
			assert.isFalse(isValidateCommandArgumentsCalled);

			// Assert validateCommandArguments is not called when canExecute returns false
			commandsService.tryExecuteCommand("commandWithCanExecute", ["param"]).wait();
			assert.isFalse(isValidateCommandArgumentsCalled);
		});

		it("executes command when it implements canExecute and it returns true", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithCanExecute", ["true"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it implements canExecute and it returns false", () => {
			isCommandExecuted = false;
			commandsService.tryExecuteCommand("commandWithCanExecute", ["false"]).wait();
			assert.isFalse(isCommandExecuted);
		});
	});
});
