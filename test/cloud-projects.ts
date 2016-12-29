import stubs = require("./stubs");
import helpers = require("../lib/common/helpers");
import yok = require("../lib/common/yok");
import remoteProjectsServiceLib = require("../lib/services/remote-projects-service");
import cloudProjectsCommandsLib = require("../lib/commands/cloud-projects");
import projectConstantsLib = require("../lib/common/appbuilder/project-constants");
import {EOL} from "os";

let originalIsInteractiveMethod = helpers.isInteractive;
let assert = require("chai").assert;
import Future = require("fibers/future");
import * as util from "util";

export class LoggerStub implements ILogger {
	public outOutput = "";
	public infoOutput = "";
	public warnOutput = "";

	constructor() {
		// uncomment when debugging unit tests to print to the console
		//this.setLevel("DEBUG");
	}

	setLevel(level: string): void { /* mock */ }
	getLevel(): string { return undefined; }
	fatal(formatStr: string, ...args:string[]): void {/* mock */}
	error(formatStr: string, ...args:string[]): void {/* mock */}
	warn(formatStr: string, ...args:string[]): void {
		args.unshift(formatStr);
		this.warnOutput += util.format.apply(null, args) + EOL;
	}
	warnWithLabel(formatStr: string, ...args:string[]): void {
		this.warn(formatStr, ...args);
	}
	info(formatStr: string, ...args:string[]): void {
		args.unshift(formatStr);
		this.infoOutput += util.format.apply(null, args) + EOL;
	}
	debug(formatStr: string, ...args:string[]): void {/* mock */}
	trace(formatStr: string, ...args:string[]): void {
		// uncomment when debugging unit tests to print to the console
		//args.unshift(formatStr);
		//console.log(util.format.apply(null, args));
	}

	out(formatStr: string, ...args:string[]): void {
		args.unshift(formatStr);
		this.outOutput += util.format.apply(null, args) + EOL;
	}

	write(...args:string[]): void {/* mock */}

	printMarkdown(...args:string[]): void {/* mock */}

	prepare(item: any): string { return item; }

	printInfoMessageOnSameLine(message: string): void {/* mock */}
	printMsgWithTimeout(message: string, timeout: number): IFuture<void> {
		return null;
	}
}

export class PrompterStub {
	constructor(public promptSlnName: string, public promptPrjName: string) {}
	public isPrompterCalled = false;
	promptForChoice(promptMessage: string, choices: any[]): IFuture<any> {
		this.isPrompterCalled = true;
		if(promptMessage.indexOf("solution") === -1) {
			assert.isTrue(_.includes(choices, this.promptPrjName));
			return Future.fromResult(this.promptPrjName);
		}

		assert.isTrue(_.includes(choices, this.promptSlnName));
		return Future.fromResult(this.promptSlnName);
	}
}

function createTestInjector(promptSlnName?: string, promptPrjName?: string, isInteractive?: boolean): IInjector {
	let testInjector = new yok.Yok();
	let helpers = require("../lib/common/helpers");
	isInteractive = isInteractive !== false;
	helpers.isInteractive = () => { return isInteractive; };
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("userDataStore", {
		getUser: () =>  Future.fromResult({tenant: {id: "id"}}),
	});
	testInjector.register("serviceProxy", {
		makeTapServiceCall: (call: () => IFuture<any>, solutionSpaceHeaderOptions?: {discardSolutionSpaceHeader: boolean}) => {return call();}
	});

	testInjector.register("serviceProxyBase", {
		call: (tenantId: string) => { return Future.fromResult(
				[{
					"id": "id2",
					"name": "Sln2",
					"type": "Hybrid",
					"accountId": "accountId",
					"settings": {},
					"isMigrating": false,
					"description": "AppBuilder cross platform project"
				},
				{
					"id": "id1",
					"name": "Sln1",
					"type": "Hybrid",
					"accountId": "accountId",
					"settings": {},
					"isMigrating": false,
					"description": "AppBuilder cross platform project"
				},
				{
					"id": "id3",
					"name": "Sln3",
					"type": "Hybrid",
					"accountId": "accountId",
					"settings": {},
					"isMigrating": false,
					"description": "AppBuilder cross platform project"
				}]);
			},
		setShouldAuthenticate: (shouldAuthenticate: boolean) => false
	});

	testInjector.register("server", {
		tap: {
			getExistingClientSolutions: () => {
				return Future.fromResult();
			},

			getFeatures: (accountId: string, serviceType: string) => {
				return Future.fromResult(["projects-to-app"]);
			}
		},
		apps: {
			getApplication: (slnName: string, checkUpgradability: boolean) => {
				if(slnName === "id1") {
					return Future.fromResult({
						"Name": "Sln1",
						"Items": [
							{
								"Name": "BlankProj",
								"RelativePath": "BlankProj",
								"Items": [
									{
										"Type": "Content",
										"Identifier": ".abignore"
									}
								],
								"Properties": {
									"ProjectName": "BlankProj",
									"Framework": "Cordova"
								}
							},
							{
								"Name": "ABlankProjMobileTesting",
								"RelativePath": "ABlankProjMobileTesting",
								"Items": [
									{
										"Type": "Content",
										"Identifier": ".abignore"
									},
									{
										"Type": "Content",
										"Identifier": "MobileTestingSuite1.js"
									}
								],
								"Properties": {
									"ProjectName": "ABlankProjMobileTesting",
									"Framework": "MobileTesting"
								},
								"PerConfigurationProperties": {}
							}
						],
						"IsUpgradeable": false
					});
				} else if (slnName === "id2") {
					return Future.fromResult({
						"Name": "Sln1",
						"Items": [],
						"IsUpgradeable": false
					});
				} else if(slnName === "id3") {
					return Future.fromResult({
						"Name": "Sln1",
						"Items": [
							{
								"Name": "BlankProj",
								"RelativePath": "BlankProj",
								"Items": [
									{
										"Type": "Content",
										"Identifier": ".abignore"
									}
								],
								"Properties": {
									"ProjectName": "BlankProj",
									"Framework": "Cordova"
								}
							}
						],
						"IsUpgradeable": false
					});
				}
			},
			exportApplication: (solutionName: string, skipMetadata: boolean, $resultStream: any) => {
				return Future.fromResult();
			}
		},
		appsProjects: {
			exportProject: (solutionName: string, projectName: string, skipMetadata: boolean, $resultStream: any) => {
				return Future.fromResult();
			}
		}
	});
	testInjector.register("fs", {
		exists: (path: string) => {
			if(path.indexOf("abproject") !== -1) {
				return true;
			} else {
				return false;
			}
		},
		createWriteStream: (path: string) => {/* mock */},
		unzip: (zipFile: string, destinationDir: string) => Future.fromResult(),
		readDirectory: (projectDir: string): string[] => []
	});
	testInjector.register("remoteProjectService", remoteProjectsServiceLib.RemoteProjectService);
	testInjector.register("projectConstants", projectConstantsLib.ProjectConstants);
	testInjector.register("project", {
		getNewProjectDir:() => "proj dir",
		createProjectFile: (projectDir: string, properties: any) => Future.fromResult()
	});
	testInjector.register("prompter", new PrompterStub(promptSlnName, promptPrjName));
	testInjector.register("logger", new LoggerStub());
	testInjector.register("options", {});
	return testInjector;
}

describe("cloud project commands", () => {
	after(() => {
		helpers.isInteractive = originalIsInteractiveMethod;
	});

	describe("export project command", () => {
		let testInjector: IInjector;
		let exportProjectCommand: ICommand;

		describe("canExecute", () => {
			describe("when console is interactive", () => {
				beforeEach(() => {
					testInjector = createTestInjector();
					exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
				});

				it("returns true when no arguments are specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute([]));
				});

				it("returns true when valid solution name is specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute(["Sln1"]));
				});

				it("returns true when valid solution name and project name are specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute(["Sln1", "BlankProj"]));
				});

				it("returns true when valid solution index is specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute(["1"]));
				});

				it("returns true when valid solution id and project name are specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute(["1", "BlankProj"]));
				});

				it("returns true when valid solution name and project id are specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute(["Sln1", "2"]));
				});

				it("returns true when valid solution id and project id are specified", () => {
					await assert.isTrue(exportProjectCommand.canExecute(["1", "2"]));
				});

				it("fails when more than two arguments are passed", () => {
					assert.throws(() => await  exportProjectCommand.canExecute(["1", "2", "3"]));
				});

				it("fails when solution does not have any projects", () => {
					assert.throws(() => await  exportProjectCommand.canExecute(["Sln2"]));
				});

				it("fails when there's projectData", () => {
					let project = testInjector.resolve("project");
					project.projectData = <any>{};
					assert.throws(() => await  exportProjectCommand.canExecute(["Sln1", "BlankProj"]));
				});
			});

			it("fails when console is not interactive and command arguments are not passed", () => {
				testInjector = createTestInjector("", "", false);
				exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
				assert.throws(() => await  exportProjectCommand.canExecute([]));
			});
		});

		// in this tests we assume parameters are correct as commands service will verify them in canExecute method, which is called before this one
		describe("еxecute", () => {
			let logger: LoggerStub;

			describe("successfully exports project when solution and project names are passed", () => {
				beforeEach(() => {
					testInjector = createTestInjector();
					exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
					logger = testInjector.resolve("logger");
					assert.equal("", logger.infoOutput);
				});

				afterEach(() => {
					assert.isTrue(logger.infoOutput.indexOf("has been successfully exported") !== -1);
				});

				it("successfully exports project when solution name and project name are correct", () => {
					await exportProjectCommand.execute(["Sln1", "BlankProj"]);
				});

				it("successfully exports project when solution id and project name are correct", () => {
					await exportProjectCommand.execute(["1", "BlankProj"]);
				});

				it("successfully exports project when solution name and project id are correct", () => {
					await exportProjectCommand.execute(["Sln1", "2"]);
				});

				it("successfully exports project when solution id and project id are correct", () => {
					await exportProjectCommand.execute(["1", "2"]);
				});
			});

			describe("works correctly when only solution name is passed", () => {
				beforeEach(() => {
					testInjector = createTestInjector("Sln1", "BlankProj");
					exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
					logger = testInjector.resolve("logger");
					assert.equal("", logger.infoOutput);
				});

				it("successfully exports project when solution name is correct and there are more than one projects in solution", () => {
					await exportProjectCommand.execute(["Sln1"]);
					assert.isTrue(logger.infoOutput.indexOf("has been successfully exported") !== -1);
				});

				it("successfully exports project when solution name is correct and there is only one projects in solution", () => {
					await exportProjectCommand.execute(["Sln3"]);
					let prompter:PrompterStub = testInjector.resolve("prompter");
					assert.isFalse(prompter.isPrompterCalled);
					assert.isTrue(logger.infoOutput.indexOf("has been successfully exported") !== -1);
				});
			});

			it("works correctly when no arguments are passed", () => {
					testInjector = createTestInjector("Sln1", "BlankProj");
					exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
					await exportProjectCommand.execute([]);
					logger = testInjector.resolve("logger");
					assert.isTrue(logger.infoOutput.indexOf("has been successfully exported") !== -1);
			});

			describe("fails when project is already created", () => {
				let project: Project.IProject;
				let fs: IFileSystem;
				beforeEach(() => {
					testInjector = createTestInjector("Sln1", "BlankProj");
					exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
					logger = testInjector.resolve("logger");
					assert.equal("", logger.infoOutput);
					project = testInjector.resolve("project");
					fs = testInjector.resolve("fs");
				});

				it("fails when projectDir exists", () => {
					fs.exists = (projectDir: string) => true;
					assert.throws(() => await  exportProjectCommand.execute(["Sln1", "BlankProj"]));
				});

				it("warns when unable to create project file", () => {
					fs.exists = (param: string) => false;
					project.createProjectFile = (projectDir: string, properties: any) => {
						let future = new Future<void>();
						future.throw(new Error("error is raised"));
						return future;
					};
					logger = testInjector.resolve("logger");
					await exportProjectCommand.execute(["Sln1", "BlankProj"]);
					assert.isTrue(logger.warnOutput.indexOf("Couldn't create project file: error is raised") !== -1);
				});
			});
		});
});

	describe("list project command", () => {
		let testInjector: IInjector;
		let listProjectCommand: ICommand;
		describe("command parameter works correctly", () => {
			let commandParamter: ICommandParameter;
			beforeEach(() => {
				testInjector = createTestInjector("Sln1", "BlankProj");
				listProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudListProjectsCommand);
				commandParamter = listProjectCommand.allowedParameters[0];
			});

			it("validate method returns true when valid solution name is passed", () => {
				await assert.isTrue(commandParamter.validate("Sln1"));
			});

			it("validate method returns true when valid solution id is passed", () => {
				await assert.isTrue(commandParamter.validate("1"));
			});

			it("validate method throws error when invalid solution name is passed", () => {
				assert.throws(() => await  commandParamter.validate("Invalid name"));
			});

			it("validate method throws error when invalid solution id is passed", () => {
				assert.throws(() => await  commandParamter.validate("100"));
			});

			it("validate method returns false when validation value is not passed", () => {
				await assert.isFalse(commandParamter.validate(undefined));
			});
		});

		describe("lists projects", () => {
			let logger: LoggerStub;
			beforeEach(() => {
				testInjector = createTestInjector("Sln1", "BlankProj");
				listProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudListProjectsCommand);
				logger = testInjector.resolve("logger");
				assert.equal("", logger.outOutput);
			});

			afterEach(() => {
				let blankProjIndex = logger.outOutput.indexOf("BlankProj");
				let aBlankPrjMobileTestingIndex = logger.outOutput.indexOf("ABlankProjMobileTesting");
				assert.isTrue(blankProjIndex !== -1);
				assert.isTrue(aBlankPrjMobileTestingIndex !== -1);
				assert.isTrue(aBlankPrjMobileTestingIndex < blankProjIndex);
			});

			it("when solution name is passed", () => {
				await listProjectCommand.execute(["Sln1"]);
			});

			it("when solution id is passed", () => {
				await listProjectCommand.execute(["1"]);
			});

			it("when solution name is NOT passed", () => {
				await listProjectCommand.execute([]);
			});
		});

		describe("lists solutions", () => {
			it("when no parameter provided in NON-interactive console", () => {
				testInjector = createTestInjector("Sln1", "BlankProj", false);
				let logger = testInjector.resolve("logger");
				listProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudListProjectsCommand);
				assert.equal("", logger.outOutput);

				await listProjectCommand.execute([]);

				let sln1Index = logger.outOutput.indexOf("Sln1"),
					sln2Index = logger.outOutput.indexOf("Sln2"),
					sln3Index = logger.outOutput.indexOf("Sln3");

				assert.isTrue(sln1Index !== -1);
				assert.isTrue(sln2Index !== -1);
				assert.isTrue(sln3Index !== -1);
			});

			it("when --all option provided in interactive console", () => {
				testInjector = createTestInjector("Sln1", "BlankProj");
				let logger = testInjector.resolve("logger"),
					opts = testInjector.resolve("options");

				opts.all = true;
				listProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudListProjectsCommand);
				assert.equal("", logger.outOutput);

				await listProjectCommand.execute([]);

				let sln1Index = logger.outOutput.indexOf("Sln1"),
					sln2Index = logger.outOutput.indexOf("Sln2"),
					sln3Index = logger.outOutput.indexOf("Sln3");

				assert.isTrue(sln1Index !== -1);
				assert.isTrue(sln2Index !== -1);
				assert.isTrue(sln3Index !== -1);
			});
		});
	});
});
