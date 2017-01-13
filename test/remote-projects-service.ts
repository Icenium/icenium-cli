import stubs = require("./stubs");
import yok = require("../lib/common/yok");
import remoteProjectsServiceLib = require("../lib/services/remote-projects-service");
import projectConstantsLib = require("../lib/common/appbuilder/project-constants");
import { assert } from "chai";

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();
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
	testInjector.register("project", {
		getNewProjectDir: () => "proj dir",
		createProjectFile: (projectDir: string, properties: any) => Promise.resolve()
	});
	testInjector.register("projectConstants", projectConstantsLib.ProjectConstants);
	testInjector.register("fs", {
		exists: (path: string) => {
			if (path.indexOf("abproject") !== -1) {
				return true;
			} else {
				return false;
			}
		},
		createWriteStream: (path: string) => { /* intentionally empty body*/ },
		unzip: (zipFile: string, destinationDir: string) => Promise.resolve(),
		readDirectory: (projectDir: string): string[] => []
	});
	testInjector.register("logger", stubs.LoggerStub);
	return testInjector;
}

describe("remote project service", () => {
	const invalidName = "Invalid name";
	const identifierFive = "5";
	const couldNotFindProjectErrorMessage = "Could not find project named \'%s\' inside \'%s\' solution or was not given a valid index. List available solutions with \'cloud list\' command";

	let testInjector: IInjector;
	let remoteProjectService: IRemoteProjectService;
	beforeEach(() => {
		testInjector = createTestInjector();
		remoteProjectService = testInjector.resolve(remoteProjectsServiceLib.RemoteProjectService);
	});

	it("getSolutions returns correct sorted results", async () => {
		let solutions = await remoteProjectService.getAvailableAppsAndSolutions();
		let expectedResult = ["Sln1", "Sln2"];
		assert.deepEqual(expectedResult, solutions.map(sln => sln.name));
	});

	describe("getProjectsForSolution", () => {
		it("fails when solution name does not exist", async () => {
			await assert.isRejected(remoteProjectService.getProjectsForSolution(invalidName), `Unable to find app with identifier ${invalidName}.`);
		});

		it("returns correct sorted result when name is correct", async () => {
			let projects = await remoteProjectService.getProjectsForSolution("Sln1");
			let expectedResult = ["ABlankProjMobileTesting", "BlankProj"];
			assert.deepEqual(expectedResult, projects.map(pr => pr.Name));
		});

		it("returns correct sorted result when passed index is correct", async () => {
			let projects = await remoteProjectService.getProjectsForSolution("1");
			let expectedResult = ["ABlankProjMobileTesting", "BlankProj"];
			assert.deepEqual(expectedResult, projects.map(pr => pr.Name));
		});

		it("fails when solution index is out of range", async () => {
			await assert.isRejected(remoteProjectService.getProjectsForSolution(identifierFive), `Unable to find app with identifier ${identifierFive}.`);
		});
	});

	describe("getProjectProperties", () => {
		let expectedPropertiesResult = {
			"ProjectName": "BlankProj",
			"Framework": "Cordova"
		};

		it("fails when solution name is not correct", async () => {
			await assert.isRejected(remoteProjectService.getProjectProperties(invalidName, "BlankProj"), `Unable to find app with identifier ${invalidName}.`);
		});

		it("fails when solution index is not correct", async () => {
			await assert.isRejected(remoteProjectService.getProjectProperties(identifierFive, "BlankProj"), `Unable to find app with identifier ${identifierFive}.`);
		});

		it("fails when project name is not correct", async () => {
			await assert.isRejected(remoteProjectService.getProjectProperties("Sln1", invalidName), couldNotFindProjectErrorMessage);
		});

		it("fails when project index is not correct", async () => {
			await assert.isRejected(remoteProjectService.getProjectProperties("Sln1", identifierFive), couldNotFindProjectErrorMessage);
		});

		it("returns correct properties when solution name and project name are correct", async () => {
			let properties = await remoteProjectService.getProjectProperties("Sln1", "BlankProj");
			assert.deepEqual(expectedPropertiesResult, properties);
		});

		it("returns correct properties when solution id and project name are correct", async () => {
			let properties = await remoteProjectService.getProjectProperties("1", "BlankProj");
			assert.deepEqual(expectedPropertiesResult, properties);
		});

		it("returns correct properties when solution name and project id are correct", async () => {
			let properties = await remoteProjectService.getProjectProperties("Sln1", "2");
			assert.deepEqual(expectedPropertiesResult, properties);
		});

		it("returns correct properties when solution name and project id are correct", async () => {
			let properties = await remoteProjectService.getProjectProperties("1", "2");
			assert.deepEqual(expectedPropertiesResult, properties);
		});
	});

	describe("getProjectName", () => {
		let expectedResult = "BlankProj";
		it("fails when solution name is not correct", async () => {
			await assert.isRejected(remoteProjectService.getProjectName(invalidName, "BlankProj"), `Unable to find app with identifier ${invalidName}.`);
		});

		it("fails when solution index is not correct", async () => {
			await assert.isRejected(remoteProjectService.getProjectName(identifierFive, "BlankProj"), `Unable to find app with identifier ${identifierFive}.`);
		});

		it("fails when solution name is correct but project name is not", async () => {
			await assert.isRejected(remoteProjectService.getProjectName("Sln1", invalidName), couldNotFindProjectErrorMessage);
		});

		it("fails when solution name is correct but project id is not", async () => {
			await assert.isRejected(remoteProjectService.getProjectName("Sln1", identifierFive), couldNotFindProjectErrorMessage);
		});

		it("returns correct name when solution name and project name are correct", async () => {
			let projName = await remoteProjectService.getProjectName("Sln1", "BlankProj");
			assert.deepEqual(expectedResult, projName);
		});

		it("returns correct name when solution id and project name are correct", async () => {
			let projName = await remoteProjectService.getProjectName("1", "BlankProj");
			assert.deepEqual(expectedResult, projName);
		});

		it("returns correct name when solution name and project id are correct", async () => {
			let projName = await remoteProjectService.getProjectName("Sln1", "2");
			assert.deepEqual(expectedResult, projName);
		});
	});
});
