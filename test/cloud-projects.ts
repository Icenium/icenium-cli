import stubs = require("./stubs");
import helpers = require("../lib/common/helpers");
import yok = require("../lib/common/yok");
import remoteProjectsServiceLib = require("../lib/services/remote-projects-service");
import cloudProjectsCommandsLib = require("../lib/commands/cloud-projects");
import projectConstantsLib = require("../lib/common/appbuilder/project-constants");
import { EOL } from "os";
import { assert } from "chai";
import * as path from "path";

let originalIsInteractiveMethod = helpers.isInteractive;
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
	fatal(formatStr: string, ...args: string[]): void {/* mock */ }
	error(formatStr: string, ...args: string[]): void {/* mock */ }
	warn(formatStr: string, ...args: string[]): void {
		args.unshift(formatStr);
		this.warnOutput += util.format.apply(null, args) + EOL;
	}
	warnWithLabel(formatStr: string, ...args: string[]): void {
		this.warn(formatStr, ...args);
	}
	info(formatStr: string, ...args: string[]): void {
		args.unshift(formatStr);
		this.infoOutput += util.format.apply(null, args) + EOL;
	}
	debug(formatStr: string, ...args: string[]): void {/* mock */ }
	trace(formatStr: string, ...args: string[]): void {
		// uncomment when debugging unit tests to print to the console
		//args.unshift(formatStr);
		//console.log(util.format.apply(null, args));
	}

	out(formatStr: string, ...args: string[]): void {
		args.unshift(formatStr);
		this.outOutput += util.format.apply(null, args) + EOL;
	}

	write(...args: string[]): void {/* mock */ }

	printMarkdown(...args: string[]): void {/* mock */ }

	prepare(item: any): string { return item; }

	printInfoMessageOnSameLine(message: string): void {/* mock */ }
	async printMsgWithTimeout(message: string, timeout: number): Promise<void> {
		return null;
	}
}

export class PrompterStub {
	constructor(public promptSlnName: string, public promptPrjName: string) { }
	public isPrompterCalled = false;
	async promptForChoice(promptMessage: string, choices: any[]): Promise<any> {
		this.isPrompterCalled = true;
		if (promptMessage.indexOf("solution") === -1) {
			assert.isTrue(_.includes(choices, this.promptPrjName));
			return Promise.resolve(this.promptPrjName);
		}

		assert.isTrue(_.includes(choices, this.promptSlnName));
		return Promise.resolve(this.promptSlnName);
	}
}

function createTestInjector(promptSlnName?: string, promptPrjName?: string, isInteractive?: boolean): IInjector {
	let testInjector = new yok.Yok();
	let helpers = require("../lib/common/helpers");
	isInteractive = isInteractive !== false;
	helpers.isInteractive = () => { return isInteractive; };
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("userDataStore", {
		getUser: () => Promise.resolve({ tenant: { id: "id" } }),
	});
	testInjector.register("serviceProxy", {
		makeTapServiceCall: (call: () => Promise<any>, solutionSpaceHeaderOptions?: { discardSolutionSpaceHeader: boolean }) => { return call(); }
	});

	testInjector.register("serviceProxyBase", {
		call: (tenantId: string) => {
			return Promise.resolve(
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
				return Promise.resolve();
			},

			getFeatures: (accountId: string, serviceType: string) => {
				return Promise.resolve(["projects-to-app"]);
			}
		},
		apps: {
			getApplication: (slnName: string, checkUpgradability: boolean) => {
				if (slnName === "id1") {
					return Promise.resolve({
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
					return Promise.resolve({
						"Name": "Sln1",
						"Items": [],
						"IsUpgradeable": false
					});
				} else if (slnName === "id3") {
					return Promise.resolve({
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
				return Promise.resolve();
			}
		},
		appsProjects: {
			exportProject: (solutionName: string, projectName: string, skipMetadata: boolean, $resultStream: any) => {
				return Promise.resolve();
			}
		}
	});
	testInjector.register("fs", {
		exists: (path: string) => {
			if (path.indexOf("abproject") !== -1) {
				return true;
			} else {
				return false;
			}
		},
		createWriteStream: (path: string) => {/* mock */ },
		unzip: (zipFile: string, destinationDir: string) => Promise.resolve(),
		readDirectory: (projectDir: string): string[] => []
	});
	testInjector.register("remoteProjectService", remoteProjectsServiceLib.RemoteProjectService);
	testInjector.register("projectConstants", projectConstantsLib.ProjectConstants);
	testInjector.register("project", {
		getNewProjectDir: () => "proj dir",
		createProjectFile: (projectDir: string, properties: any) => Promise.resolve()
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
					assert.eventually.isTrue(exportProjectCommand.canExecute([]));
				});

				it("returns true when valid solution name is specified", () => {
					assert.eventually.isTrue(exportProjectCommand.canExecute(["Sln1"]));
				});

				it("returns true when valid solution name and project name are specified", () => {
					assert.eventually.isTrue(exportProjectCommand.canExecute(["Sln1", "BlankProj"]));
				});

				it("returns true when valid solution index is specified", () => {
					assert.eventually.isTrue(exportProjectCommand.canExecute(["1"]));
				});

				it("returns true when valid solution id and project name are specified", () => {
					assert.eventually.isTrue(exportProjectCommand.canExecute(["1", "BlankProj"]));
				});

				it("returns true when valid solution name and project id are specified", () => {
					assert.eventually.isTrue(exportProjectCommand.canExecute(["Sln1", "2"]));
				});

				it("returns true when valid solution id and project id are specified", () => {
					assert.eventually.isTrue(exportProjectCommand.canExecute(["1", "2"]));
				});

				it("fails when more than two arguments are passed", async () => {
					await assert.isRejected(exportProjectCommand.canExecute(["1", "2", "3"]), "This command accepts maximum two parameters - solution name and project name.");
				});

				it("fails when solution does not have any projects", async () => {
					const solutionName = "Sln2";
					await assert.isRejected(exportProjectCommand.canExecute([solutionName]), `Solution ${solutionName} does not have any projects.`);
				});

				it("fails when there's projectData", async () => {
					let project = testInjector.resolve("project");
					project.projectData = <any>{};
					await assert.isRejected(exportProjectCommand.canExecute(["Sln1", "BlankProj"]), "Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
				});
			});

			it("fails when console is not interactive and command arguments are not passed", async () => {
				testInjector = createTestInjector("", "", false);
				exportProjectCommand = testInjector.resolve(cloudProjectsCommandsLib.CloudExportProjectsCommand);
				await assert.isRejected(exportProjectCommand.canExecute([]), "When console is not interactive, you have to provide at least one argument.");
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

				it("successfully exports project when solution name and project name are correct", async () => {
					await exportProjectCommand.execute(["Sln1", "BlankProj"]);
				});

				it("successfully exports project when solution id and project name are correct", async () => {
					await exportProjectCommand.execute(["1", "BlankProj"]);
				});

				it("successfully exports project when solution name and project id are correct", async () => {
					await exportProjectCommand.execute(["Sln1", "2"]);
				});

				it("successfully exports project when solution id and project id are correct", async () => {
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

				it("successfully exports project when solution name is correct and there are more than one projects in solution", async () => {
					await exportProjectCommand.execute(["Sln1"]);
					assert.isTrue(logger.infoOutput.indexOf("has been successfully exported") !== -1);
				});

				it("successfully exports project when solution name is correct and there is only one projects in solution", async () => {
					await exportProjectCommand.execute(["Sln3"]);
					let prompter: PrompterStub = testInjector.resolve("prompter");
					assert.isFalse(prompter.isPrompterCalled);
					assert.isTrue(logger.infoOutput.indexOf("has been successfully exported") !== -1);
				});
			});

			it("works correctly when no arguments are passed", async () => {
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

				it("fails when projectDir exists", async () => {
					fs.exists = (projectDir: string) => true;
					const solutionName = "Sln1";
					await assert.isRejected(exportProjectCommand.execute([solutionName, "BlankProj"]), `The folder proj ${path.join("dir", solutionName)} already exists!`);
				});

				it("warns when unable to create project file", async () => {
					fs.exists = (param: string) => false;
					project.createProjectFile = (projectDir: string, properties: any) => {
						return new Promise<void>((resolve, reject) => {
							reject(new Error("error is raised"));
						});
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
				assert.eventually.isTrue(commandParamter.validate("Sln1"));
			});

			it("validate method returns true when valid solution id is passed", () => {
				assert.eventually.isTrue(commandParamter.validate("1"));
			});

			it("validate method throws error when invalid solution name is passed", async () => {
				const invalidName = "Invalid name";
				await assert.isRejected(commandParamter.validate(invalidName), `Unable to find app with identifier ${invalidName}.`);
			});

			it("validate method throws error when invalid solution id is passed", async () => {
				const identifier = "100";
				await assert.isRejected(commandParamter.validate(identifier), `Unable to find app with identifier ${identifier}.`);
			});

			it("validate method returns false when validation value is not passed", () => {
				assert.eventually.isFalse(commandParamter.validate(undefined));
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

			it("when solution name is passed", async () => {
				await listProjectCommand.execute(["Sln1"]);
			});

			it("when solution id is passed", async () => {
				await listProjectCommand.execute(["1"]);
			});

			it("when solution name is NOT passed", async () => {
				await listProjectCommand.execute([]);
			});
		});

		describe("lists solutions", () => {
			it("when no parameter provided in NON-interactive console", async () => {
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

			it("when --all option provided in interactive console", async () => {
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
