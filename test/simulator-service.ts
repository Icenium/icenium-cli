import stubs = require("./stubs");
import yok = require("../lib/common/yok");
import { assert } from "chai";
import { EOL } from "os";

let staticConfig: any = {
	TRACK_FEATURE_USAGE_SETTING_NAME: "AnalyticsSettings.TrackFeatureUsage",
	TRACK_EXCEPTIONS_SETTING_NAME: "AnalyticsSettings.TrackExceptions"
};
import simulatorServiceLib = require("../lib/services/simulator-service");
import staticConfigLib = require("../lib/config");

let projectDir = "ProjectDir";
let baseParams = ["param1", "param2"];
let passedParametersToSimulator: string[];

function createTestInjector(isFeatureTrackingEnabled: boolean, isExceptionsTrackingEnabled: boolean, isRunning?: boolean, useBeforeDownloadAction?: boolean): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("loginManager", {
		ensureLoggedIn: () => { return Promise.resolve(); }
	});
	testInjector.register("projectMigrationService", {
		migrateTypeScriptProject: () => Promise.resolve()
	});
	testInjector.register("processInfo", {
		isRunning: (executableName: string) => { return Promise.resolve(!!isRunning); }
	});
	testInjector.register("project", {
		getProjectDir: () => projectDir,
		ensureAllPlatformAssets: () => { /* Intentionally left blanck */ }
	});
	testInjector.register("projectSimulatorService", {
		getSimulatorParams: (simulatorPackageName: string) => { return Promise.resolve(baseParams); }
	});
	testInjector.register("serverExtensionsService", {
		getExtensionPath: (packageName: string) => { return "extensionPath"; },
		prepareExtension: (packageName: string, beforeDownloadPackageAction: () => Promise<void>) => {
			if (useBeforeDownloadAction) {
				return beforeDownloadPackageAction();
			}
			return Promise.resolve();
		}
	});
	testInjector.register("simulatorPlatformServices", {
		packageName: "packageName",
		executableName: "executableName",
		runApplication: (applicationPath: string, applicationParams: string[]) => {
			passedParametersToSimulator = applicationParams;
		}
	});

	testInjector.register("staticConfig", staticConfigLib.StaticConfig);
	testInjector.register("analyticsService", {
		isEnabled: (featureName: string) => {
			if (featureName === staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) {
				return Promise.resolve(isFeatureTrackingEnabled);
			} else if (featureName === staticConfig.TRACK_EXCEPTIONS_SETTING_NAME) {
				return Promise.resolve(isExceptionsTrackingEnabled);
			}

			return Promise.resolve(undefined);
		}
	});
	testInjector.register("simulatorService", simulatorServiceLib.SimulatorService);
	return testInjector;
}

describe("simulator-service", () => {
	describe("launchSimulator", () => {
		let testInjector: IInjector;
		let baseExpectedParameters: string[];
		let testSpecificParams: string[];

		beforeEach(() => {
			baseExpectedParameters = [
				"--path", projectDir,
				"--assemblypaths", "extensionPath",
				"--analyticsaccountcode"
			];
			testSpecificParams = [];
		});

		afterEach(async () => {
			let service = testInjector.resolve("simulatorService");
			await service.launchSimulator();
			let _staticConfig: IStaticConfig = testInjector.resolve("staticConfig");
			baseExpectedParameters = baseExpectedParameters.concat([_staticConfig.ANALYTICS_API_KEY]);
			testSpecificParams = testSpecificParams.concat(baseParams);
			assert.deepEqual(baseExpectedParameters.concat(testSpecificParams), passedParametersToSimulator);
		});

		it("passed parameters are correct when featureUsageTracking and exceptionsTracking are disabled", () => {
			testInjector = createTestInjector(false, false);
		});

		it("passed parameters are correct when featureUsageTracking and exceptionsTracking are enabled", () => {
			testInjector = createTestInjector(true, true);
			testSpecificParams = ["--trackfeatureusage", "--trackexceptions"];
		});

		it("passed parameters are correct when featureUsageTracking is enabled and exceptionsTracking is disabled", () => {
			testInjector = createTestInjector(true, false);
			testSpecificParams = ["--trackfeatureusage"];
		});

		it("passed parameters are correct when featureUsageTracking is disabled and exceptionsTracking is enabled", () => {
			testInjector = createTestInjector(false, true);
			testSpecificParams = ["--trackexceptions"];
		});
	});

	it("launchSimulator fails when simulator is running during download of new version", async () => {
		let testInjector = createTestInjector(true, true, true, true);
		let service = testInjector.resolve("simulatorService");
		await assert.isRejected(service.launchSimulator(), `AppBuilder Simulator is currently running and cannot be updated.${EOL}Close it and run $ appbuilder simulate again.`);
	});

	it("launchSimulator does not fail when simulator is running during download of new version", async () => {
		let testInjector = createTestInjector(true, true, false, true);
		let service = testInjector.resolve("simulatorService");
		await service.launchSimulator();
	});
});
