import stubs = require("./stubs");
import yok = require("../lib/common/yok");
import Future = require("fibers/future");
import {assert} from "chai";
let staticConfig: any =  {
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
		ensureLoggedIn: () => { return Future.fromResult(); }
	});
	testInjector.register("projectMigrationService", {
		ensureAllPlatformAssets: () => { return Future.fromResult(); },
		migrateTypeScriptProject: () => Future.fromResult()
	});
	testInjector.register("processInfo", {
		isRunning: (executableName: string) => { return Future.fromResult(!!isRunning); }
	});
	testInjector.register("project", {
		getProjectDir: () => projectDir
	});
	testInjector.register("projectSimulatorService", {
		getSimulatorParams: (simulatorPackageName: string) => { return Future.fromResult(baseParams); }
	});
	testInjector.register("serverExtensionsService", {
		getExtensionPath: (packageName: string) => { return "extensionPath"; },
		prepareExtension: (packageName: string, beforeDownloadPackageAction: () => IFuture<void>) => {
			if(useBeforeDownloadAction) {
				return beforeDownloadPackageAction();
			}
			return Future.fromResult();
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
			if(featureName === staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) {
				return Future.fromResult(isFeatureTrackingEnabled);
			} else if (featureName === staticConfig.TRACK_EXCEPTIONS_SETTING_NAME) {
				return Future.fromResult(isExceptionsTrackingEnabled);
			}

			return Future.fromResult(undefined);
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

		afterEach(() => {
			let service = testInjector.resolve("simulatorService");
			service.launchSimulator().wait();
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

	it("launchSimulator fails when simulator is running during download of new version", () => {
		let testInjector = createTestInjector(true, true, true, true);
		let service = testInjector.resolve("simulatorService");
		assert.throws(() => service.launchSimulator().wait());
	});

	it("launchSimulator does not fail when simulator is running during download of new version", () => {
		let testInjector = createTestInjector(true, true, false, true);
		let service = testInjector.resolve("simulatorService");
		service.launchSimulator().wait();
	});
});
