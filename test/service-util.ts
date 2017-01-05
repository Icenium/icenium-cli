import chai = require("chai");
import ServiceUtil = require("../lib/service-util");
import Future = require("fibers/future");
import stubs = require("./stubs");
import yok = require("../lib/common/yok");
let assert: chai.Assert = chai.assert;

let testInjector = new yok.Yok();
testInjector.register("logger", stubs.LoggerStub);
testInjector.register("serverConfiguration", {});
testInjector.register("errors", stubs.ErrorsStub);
testInjector.register("npmService", {
	getPackageJsonFromNpmRegistry: (packageName: string) => Promise.resolve({ version: "3.0.0" })
});

class MockUserDataStore implements IUserDataStore {
	async hasCookie(): Promise<boolean> {
		return Promise.resolve(false);
	}

	async getCookies(): Promise<IStringDictionary> {
		return { "tlrkappshell": "dummy" };
	}

	async getUser(): Promise<any> {
		return undefined;
	}

	setCookies(cookies?: IStringDictionary): void {
		return undefined;
	}

	parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): void {
		return undefined;
	}

	async setUser(user?: any): Promise<void> {
		return undefined;
	}

	async clearLoginData(): Promise<void> {
		return undefined;
	}
}
testInjector.register("userDataStore", MockUserDataStore);

class MockHttpClient implements Server.IHttpClient {
	public options: any;
	public mockResponse: Server.IResponse;
	public mockError: any;

	async httpRequest(options: any): Promise<Server.IResponse> {
		this.options = options;
		return new Promise<Server.IResponse>((resolve, reject) => {
			if (this.mockError) {
				reject(this.mockError);
			} else {
				resolve(this.mockResponse);
			}
		});
	}

	public setResponse(headers: any, body?: any, error?: any) {
		this.mockError = error;
		this.mockResponse = {
			response: {},
			headers: headers,
			body: body,
			error: error
		};
	}
}

let httpClient = new MockHttpClient();

testInjector.register("httpClient", httpClient);

function makeProxy(): Server.IServiceProxy {
	return testInjector.resolve(ServiceUtil.AppBuilderServiceProxy);
}

describe("ServiceProxy", () => {

	before(() => {
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.resolve("config").SOLUTION_SPACE_NAME = "MockedSolutionSpaceName";
	});

	it("calls api without arguments and expected return", async () => {
		let proxy = makeProxy();

		httpClient.setResponse({});

		let result = await proxy.call("test1", "GET", "authenticate", null, null, null);

		assert.equal("GET", httpClient.options.method);
		assert.equal("/appbuilder/authenticate", httpClient.options.path);
		assert.notOk(result);

		assert.ok(httpClient.options.headers["X-Icenium-SolutionSpace"]);
		assert.equal(httpClient.options.headers.Cookie, "tlrkappshell=dummy");
	});

	it("calls api and returns JSON", async () => {
		let expected = { a: "b", c: 4 };

		let proxy = makeProxy();
		httpClient.setResponse({}, JSON.stringify(expected));

		let result = await proxy.call("test2", "POST", "/json", "application/json", null, null);

		assert.isObject(result);
		assert.deepEqual(result, expected);
	});

	it("calls api and pipes result to stream", async () => {
		let proxy = makeProxy();
		httpClient.setResponse({}, null);

		let result = new (require("stream").PassThrough)();

		await proxy.call("test3", "GET", "/package/zip", "application/octet-stream", null, result);

		assert.strictEqual(httpClient.options.pipeTo, result);
	});

	it("throws error returned by HTTP client", () => {
		let proxy = makeProxy();
		httpClient.setResponse({}, null, new Error("404"));

		assert.throws(async () => {
			await proxy.call("test4", "GET", "/package/zip", "application/json", null, null);
		}, "404");
	});
});
