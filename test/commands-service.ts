/* tslint:disable:no-empty */
import {Yok} from "../lib/common/yok";
import future = require("fibers/future");
import * as stubs from "./stubs";
import {CommandsService} from "../lib/common/services/commands-service";
import {Configuration} from "../lib/config";
import * as util from "util";
import {assert} from "chai";
import {StringCommandParameter, StringParameterBuilder} from "../lib/common/command-params";
import {OptionType} from "../lib/common/options";
import {Options} from "../lib/options";
import {HostInfo} from "../lib/common/host-info";

let isCommandExecuted: boolean;

export class LoggerStubWithErrorOnFatal implements ILogger {
	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(formatStr: string, ...args: string[]): void { throw new Error();}
	error(formatStr: string, ...args: string[]): void { }
	warn(formatStr: string, ...args: string[]): void { }
	warnWithLabel(formatStr: string, ...args: string[]): void { }
	info(formatStr: string, ...args: string[]): void { }
	debug(formatStr: string, ...args: string[]): void { }
	trace(formatStr: string, ...args: string[]): void { }

	public output = "";

	out(formatStr: string, ...args: string[]): void {
		args.unshift(formatStr);
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }

	printMarkdown(...args:string[]): void {/* mock */}

	prepare(item: any): string { return item; }

	printInfoMessageOnSameLine(message: string): void { }
	printMsgWithTimeout(message: string, timeout: number): IFuture <void> { return null;}
}

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

class MockCommandWithOneNonMandatoryParameter implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockCommandParameter(false)];
}

class MockCommandWithSomeMandatoryParameteres implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockCommandParameter(true), new MockCommandParameter(true)];
}

class MockCommandWithoutParameters implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [];
}

class MockCommandWithInvalidParameters implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockInvalidCommandParameter(true)];
}

class MockCommandWithCanExecuteImplemented implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return future.fromResult(args[0] === "true");
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [new MockInvalidCommandParameter(true)];
}

class MockCommandWithStringCommandParameter implements ICommand {
	// Make sure stringParameter can be resolved
	constructor(private $stringParameter: ICommandParameter) { }
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [this.$stringParameter];
}

class MockCommandWithStringParamBuilder implements ICommand {
	// Make sure stringParameter can be resolved
	constructor(private $stringParameter: ICommandParameter,
		private $stringParameterBuilder: IStringParameterBuilder) { }
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Missing mandatory Parameter")];
}

class MockCommandWithIsDisabledToTrue implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	isDisabled = true;
	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [];
}

class MockCommandWithSpecificDashedOptions {
	execute(args: string[]): IFuture<void> {
		return (() => isCommandExecuted = true).future<void>()();
	}

	disableAnalytics = true;
	allowedParameters: ICommandParameter[] = [];
	dashedOptions: IDictionary<IDashedOption> = {
		"test1": {
			type: OptionType.Boolean
		}
	};
}

function createTestInjector(): IInjector {
	let testInjector = new Yok();
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("config", Configuration);
	testInjector.register("logger", LoggerStubWithErrorOnFatal);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("errors", stubs.ErrorsNoFailStub);
	testInjector.register("staticConfig", stubs.StaticConfig);
	testInjector.register("hooksService", stubs.HooksService);
	testInjector.register("commandsService", CommandsService);
	testInjector.register("stringParameter", StringCommandParameter);
	testInjector.register("stringParameterBuilder", StringParameterBuilder);
	testInjector.register("analyticsService", {
		checkConsent: (): IFuture<void> => { return future.fromResult(); },
		trackFeature: (featureName: string): IFuture<void> => { return future.fromResult(); }
	});
	testInjector.register("resources", {});
	testInjector.register("injector", testInjector);
	testInjector.register("commandsServiceProvider", {
		registerDynamicSubCommands: () => {}
	});
	testInjector.registerCommand("commandWithOneMandatArg", MockCommandWithOneMandatoryParameter);
	testInjector.registerCommand("commandWithOneNonMandatArg", MockCommandWithOneNonMandatoryParameter);
	testInjector.registerCommand("commandWithSomeMandatArgs", MockCommandWithSomeMandatoryParameteres);
	testInjector.registerCommand("commandWithoutArgs", MockCommandWithoutParameters);
	testInjector.registerCommand("commandWithInvalidArgs", MockCommandWithInvalidParameters);
	testInjector.registerCommand("commandWithCanExecute", MockCommandWithCanExecuteImplemented);
	testInjector.registerCommand("commandWithStringParam", MockCommandWithStringCommandParameter);
	testInjector.registerCommand("commandWithStringParamBuilder", MockCommandWithStringParamBuilder);
	testInjector.registerCommand("commandWithIsDisabledSetToTrue", MockCommandWithIsDisabledToTrue);
	testInjector.registerCommand("commandWithDashedOptions", MockCommandWithSpecificDashedOptions);

	return testInjector;
}

function setUpTestInjector(testInjector :IInjector, commandHelpData?: any): IInjector {
	testInjector.register("resources", {
		readJson: (resourcePath: string): any => commandHelpData,
		resolvePath: (resourcePath: string): string => {
			return '';
		}
	});

	for (let command in commandHelpData) {
		testInjector.registerCommand(command, {
			execute: (args: string[]): IFuture<void> => { return future.fromResult(); }
		});
	}

	return testInjector;
}

describe("commands service", () => {
	beforeEach(() => isCommandExecuted = false);

	describe("tryExecuteCommand", () => {
		let commandsService: any;
		let testInjector: IInjector;
		beforeEach(() => {
			testInjector = createTestInjector();
			testInjector.register("options", Options);
			commandsService = testInjector.resolve(CommandsService);
		});

		it("executes command which has only StringCommandParameter when param is NOT passed", () => {
			commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
				return (() => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				}).future<boolean>()();
			};

			commandsService.tryExecuteCommand("commandWithStringParam", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("executes command which has only StringCommandParameter when param is passed", () => {
			commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
				return (() => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				}).future<boolean>()();
			};

			commandsService.tryExecuteCommand("commandWithStringParam", ["stringParameter"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command which has mandatory StringCommandParameter created with StringParameterBuilder and param is not passed", () => {
			commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
				return (() => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				}).future<boolean>()();
			};

			commandsService.tryExecuteCommand("commandWithStringParamBuilder", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command which has mandatory StringCommandParameter created with StringParameterBuilder and param is passed", () => {
			commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
				return (() => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				}).future<boolean>()();
			};

			commandsService.tryExecuteCommand("commandWithStringParamBuilder", ["stringParameter"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("calls executeCommand when command name is valid", () => {
			commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
				return (() => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				}).future<boolean>()();
			};

			commandsService.tryExecuteCommand("commandWithoutArgs", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not call executeCommand when command name is invalid", () => {
			commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
				return (() => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				}).future<boolean>()();
			};

			commandsService.tryExecuteCommand("InvalidCommandName", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command when it has valid mandatory arguments", () => {
			commandsService.tryExecuteCommand("commandWithOneMandatArg", ["simple string param"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it has missing mandatory argument", () => {
			commandsService.tryExecuteCommand("commandWithOneMandatArg", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command when it doesn't accept arguments and there aren't passed any", () => {
			commandsService.tryExecuteCommand("commandWithoutArgs", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it doesn't accept arguments, but there are passed some", () => {
			commandsService.tryExecuteCommand("commandWithoutArgs", ["argument"]).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("does not execute command when it accepts arguments and the validation method of one of them is failing", () => {
			commandsService.tryExecuteCommand("commandWithInvalidArgs", []).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("executes command when it has some nonmandatory arguments and there aren't passed any", () => {
			commandsService.tryExecuteCommand("commandWithOneNonMandatArg", []).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("executes command when it has some mandatory arguments and all of them are passed", () => {
			commandsService.tryExecuteCommand("commandWithSomeMandatArgs", ["param1", "param2"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it has some mandatory arguments and not all of them are passed", () => {
			commandsService.tryExecuteCommand("commandWithSomeMandatArgs", ["param1"]).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("does not call validateMandatoryParams when command implements canExecute method.", () => {
			let isValidateCommandArgumentsCalled = false;
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
			commandsService.tryExecuteCommand("commandWithCanExecute", ["true"]).wait();
			assert.isTrue(isCommandExecuted);
		});

		it("does not execute command when it implements canExecute and it returns false", () => {
			commandsService.tryExecuteCommand("commandWithCanExecute", ["false"]).wait();
			assert.isFalse(isCommandExecuted);
		});

		it("does not execute command when it has isEnabled set to false", () => {
			commandsService.tryExecuteCommand("commandWithIsDisabledSetToTrue", []).wait();
			assert.isFalse(isCommandExecuted);
		});
	});
	describe("tryExecuteCommand when command has dashed options", () => {
		let commandsService: any;
		let testInjector: IInjector;
		beforeEach(() => {
			testInjector = createTestInjector();
		});

		it("does not execute command when it has its own dashed options and invalid one is passed", () => {
			// this is valid globally, but this command has its own dashed options and availableDevices is not part of them
			process.argv.push("--availableDevices");
			testInjector.register("options", Options);
			commandsService = testInjector.resolve("commandsService");
			commandsService.tryExecuteCommand("commandWithDashedOptions", []).wait();
			assert.isFalse(isCommandExecuted);
			process.argv.pop();
		});

		it("executes command when it has its own dashed options and one of them is passed", () => {
			// this is NOT valid globally, but this command has its own dashed options and test1 is part of them
			process.argv.push("--test1");
			testInjector.register("options", Options);
			commandsService = testInjector.resolve("commandsService");
			commandsService.tryExecuteCommand("commandWithDashedOptions", []).wait();
			assert.isTrue(isCommandExecuted);
			process.argv.pop();
		});

		it("executes command when it has its own dashed options and a global one is passed", () => {
			process.argv.push("--log");
			process.argv.push("trace");
			testInjector.register("options", Options);
			commandsService = testInjector.resolve("commandsService");
			commandsService.tryExecuteCommand("commandWithDashedOptions", []).wait();
			assert.isTrue(isCommandExecuted);
			process.argv.pop();
			process.argv.pop();
		});
	});
	describe("executeCommandUnchecked", () => {
		let commandsService: any;
		let testInjector: IInjector;
		let loggerOutput: string;
		beforeEach(() => {
			loggerOutput = '';
			testInjector = createTestInjector();
			testInjector.register("options", Options);
			testInjector.register("logger", {
				info: (str: string): void => {
					loggerOutput += str;
				},
				printMarkdown: (str: string): void => {
					loggerOutput += str;
				}
			});
		});

		it("shows command help message after successful command execute", () => {
			let commandHelpData = { testingCommand: "testingCommand" };
			testInjector = setUpTestInjector(testInjector, commandHelpData);
			commandsService = testInjector.resolve("commandsService");

			commandsService.executeCommandUnchecked(commandHelpData.testingCommand, []).wait();
			assert.deepEqual(loggerOutput, commandHelpData.testingCommand);
		});

		it("does not show command help message after unsuccessful command execute", () => {
			let commandHelpData = { testingCommand: "testingCommand" };
			testInjector = setUpTestInjector(testInjector, commandHelpData);
			commandsService = testInjector.resolve("commandsService");

			commandsService.executeCommandUnchecked("nonExistingCommand", []).wait();

			assert.deepEqual(loggerOutput, '');
		});
	});
});
