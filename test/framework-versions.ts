import yok = require("../lib/common/yok");
import { assert } from "chai";

let fileSystemFile = require("../lib/common/file-system");
let printVersionsFile = require("../lib/commands/framework-versions/print-versions");
let setVersionFile = require("../lib/commands/framework-versions/set-version");

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();

	testInjector.register("fs", fileSystemFile.FileSystem);
	testInjector.register("errors", {
		fail: (...args: any[]) => { throw new Error(args[0]); },
		failWithoutHelp: (...args: any[]) => { throw new Error(args[0]); }
	});

	testInjector.register("project", {
		ensureProject: () => {/* mock */ },
		ensureCordovaProject: () => {/* mock */ },
		projectData: {
			FrameworkVersion: "",
			Framework: "Cordova"
		},
		saveProject: (): Promise<void> => { return Promise.resolve(); },
		onFrameworkVersionChanging: (): Promise<void> => { return Promise.resolve(); },
		capabilities: {
			canChangeFrameworkVersion: true
		},
		projectType: 1 // Cordova
	});
	let migrationService = {
		getSupportedVersions: (): string[] => ["1.0.0", "1.0.1", "1.0.2"],

		getSupportedFrameworks: (): IFrameworkVersion[] => {
			return [{ displayName: "version_1_0_0", version: "1.0.0" }, { displayName: "version_1_0_1", version: "1.0.1" }];
		},

		getDisplayNameForVersion: (version: string): string => "version_1_0_0"
	};

	testInjector.register("cordovaMigrationService", migrationService);
	testInjector.register("nativeScriptMigrationService", migrationService);

	testInjector.register("mobileframework|*print", printVersionsFile.PrintFrameworkVersionsCommand);
	testInjector.register("mobileframework|set", setVersionFile.SetFrameworkVersionCommand);
	testInjector.register("projectConstants", {
		TARGET_FRAMEWORK_IDENTIFIERS: {
			Cordova: "Cordova",
			NativeScript: "NativeScript"
		}
	});

	return testInjector;
}

describe("mobileframework", () => {
	describe("MobileFrameworkCommandParameter", () => {
		let mobileFwCP: ICommandParameter;
		let testInjector: IInjector;
		beforeEach(() => {
			testInjector = createTestInjector();
		});

		describe("canChangeFrameworkVersion is true", () => {
			beforeEach(() => {
				mobileFwCP = new setVersionFile.MobileFrameworkCommandParameter(testInjector.resolve("cordovaMigrationService"),
					testInjector.resolve("project"), testInjector.resolve("errors"), testInjector.resolve("nativeScriptMigrationService"),
					testInjector.resolve("projectConstants"));
			});

			it("fails when version is not in correct format", async () => {
				let message: string;
				try {
					await mobileFwCP.validate("1");
				} catch (e) {
					message = e.message;
				}
				assert.isTrue(message.indexOf("not in correct format") > -1);
			});

			it("fails when version is not supported", async () => {
				let message: string;
				try {
					await mobileFwCP.validate("1.0.5");
				} catch (e) {
					message = e.message;
				}

				assert.isTrue(message.indexOf("not a supported version") > -1);
			});

			it("returns true when version is correct", async () => {
				await assert.isTrue(mobileFwCP.validate("1.0.0"));
			});
		});

		describe("canChangeFrameworkVersion is false", () => {
			it("validate method throws", async () => {
				let project: Project.IProject = testInjector.resolve("project");
				project.capabilities.canChangeFrameworkVersion = false;
				mobileFwCP = new setVersionFile.MobileFrameworkCommandParameter(testInjector.resolve("cordovaMigrationService"),
					testInjector.resolve("project"), testInjector.resolve("errors"), testInjector.resolve("nativeScriptMigrationService"),
					testInjector.resolve("projectConstants"));
				await assert.isRejected(mobileFwCP.validate("1.0.0"));
			});
		});
	});

	describe("print", () => {
		it("prints display names of supported versions", async () => {
			let expectedOutput = ["version_1_0_0", "version_1_0_1"];
			let testInjector = createTestInjector();
			let message: string;
			testInjector.register("logger", {
				info: (formatStr: string, ...args: string[]) => {
					message += formatStr;
				}
			});
			let mbFrm: ICommand = testInjector.resolve("mobileframework|*print");
			await mbFrm.execute([]);
			_.each(expectedOutput, version => {
				assert.isTrue(message.indexOf(version) > -1);
			});
		});

		it("print command should fail", async () => {
			let testInjector = createTestInjector();
			let message: string;
			testInjector.register("logger", {
				info: (formatStr: string, ...args: string[]) => {
					message += formatStr;
				}
			});
			let project: Project.IProject = testInjector.resolve("project");
			project.capabilities.canChangeFrameworkVersion = false;
			let mbFrm: ICommand = testInjector.resolve("mobileframework|*print");
			await assert.isRejected(mbFrm.canExecute([]));
		});
	});
});
