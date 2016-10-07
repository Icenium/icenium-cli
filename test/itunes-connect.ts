import yok = require("../lib/common/yok");
import Future = require("fibers/future");
import {assert} from "chai";
import {UploadApplicationCommand} from "../lib/commands/itunes-connect";

let appIdentifier = "com.telerik.test";

function createTestInjector() {
	let testInjector = new yok.Yok();
	testInjector.registerCommand("appstore|upload", UploadApplicationCommand);
	testInjector.register("prompter", {});
	testInjector.register("logger", {});
	testInjector.register("errors", {});
	testInjector.register("project", {
		capabilities: {
			uploadToAppstore: true
		},
		projectData: {
			AppIdentifier: appIdentifier
		}
	});
	testInjector.register("identityManager", {});
	testInjector.register("loginManager", {
		ensureLoggedIn: () => Future.fromResult()
	});
	testInjector.register("options", {});
	testInjector.register("appStoreService", {
		upload: () => Future.fromResult()
	});
	return testInjector;
}

describe("appstore upload", () => {
	let uploadCommand: ICommand;
	let prompter: IPrompter;
	let testInjector: IInjector;
	let hasAskedForInput: boolean;
	let hasAskedForPassword: boolean;
	let username = "userName";
	let password = "somePassword";

	function mockPrompter(options?: { getValueReturnValue?: any, getPasswordReturnValue?: string }): void {
		options = options || {};

		prompter.get = (): IFuture<any> => {
			return ((): any => {
				hasAskedForInput = true;
				return options.getValueReturnValue;
			}).future<any>()();
		};

		prompter.getPassword = (): IFuture<string> => {
			return ((): any => {
				hasAskedForPassword = true;
				return options.getPasswordReturnValue;
			}).future<any>()();
		};
	}

	beforeEach(() => {
		hasAskedForInput = false;
		hasAskedForPassword = false;
		testInjector = createTestInjector();
		uploadCommand = testInjector.resolveCommand("appstore|upload");
		prompter = testInjector.resolve("prompter");
	});

	it("should not ask for input if application, username and password are provided as parameters.", () => {
		mockPrompter();

		uploadCommand.execute([appIdentifier, username, password]).wait();

		assert.isFalse(hasAskedForInput);
		assert.isFalse(hasAskedForPassword);
	});

	it("should not ask for application if username and password are provided as parameters.", () => {
		mockPrompter();

		uploadCommand.execute([username, password]).wait();

		assert.isFalse(hasAskedForInput);
	});

	it("should not ask for application if username is provided as parameters.", () => {
		mockPrompter();

		uploadCommand.execute([username]).wait();

		assert.isFalse(hasAskedForInput);
	});

	it("should ask for username and password if only application is provided.", () => {
		mockPrompter({ getValueReturnValue: {} });

		uploadCommand.execute([appIdentifier]).wait();

		assert.isTrue(hasAskedForInput);
		assert.isTrue(hasAskedForPassword);
	});

	it("should ask for password if application identifier and username are provided.", () => {
		mockPrompter();

		uploadCommand.execute([appIdentifier, username]).wait();

		assert.isTrue(hasAskedForPassword);
	});

	it("should pass correct values to appstore service.", () => {
		let appStoreService: IAppStoreService = testInjector.resolve("appStoreService");
		let shouldPassCorrectValuesExpectedResult = [appIdentifier, username, password];
		let shouldPassCorrectValuesTestCases = [
			[appIdentifier, username, password],
			[appIdentifier, username],
			[username, password],
			[appIdentifier],
			[username]
		];
		let appstoreApplication: string;
		let appstoreUsername: string;
		let appstorePassword: string;

		appStoreService.upload = (receivedUsername: string, receivedPassword: string, receivedApplication: string): IFuture<void> => {
			return (() => {
				appstoreUsername = receivedUsername;
				appstorePassword = receivedPassword;
				appstoreApplication = receivedApplication;
			}).future<void>()();
		};

		_.each(shouldPassCorrectValuesTestCases, (testCase: string[]) => {
			mockPrompter({
				getValueReturnValue: { appleId: username },
				getPasswordReturnValue: password
			});

			uploadCommand.execute(testCase).wait();

			assert.deepEqual([appstoreApplication, appstoreUsername, appstorePassword], shouldPassCorrectValuesExpectedResult);
		});
	});
});
