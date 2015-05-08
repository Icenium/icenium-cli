///<reference path=".d.ts"/>
"use strict";
import chai = require("chai");
import ServiceUtil = require("../lib/service-util");
import Future = require("fibers/future");
import stubs = require("./stubs");
import yok = require("../lib/common/yok");
let assert:chai.Assert = chai.assert;

let testInjector = new yok.Yok();
testInjector.register("logger", stubs.LoggerStub);
testInjector.register("serverConfiguration", {});
testInjector.register("errors", stubs.ErrorsStub);

class MockUserDataStore implements IUserDataStore {
	hasCookie(): IFuture<boolean> {
		return Future.fromResult(false);
	}

	getCookies(): IFuture<IStringDictionary> {
		return (() => {
			return {"tlrkappshell": "dummy"};
		}).future<IStringDictionary>()();
	}

	getUser():IFuture<any> {
		return undefined;
	}

	setCookies(cookies?: IStringDictionary): IFuture<void> {
		return undefined;
	}

	parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): IFuture<void> {
		return undefined;
	}

	setUser(user?: any): IFuture<void> {
		return undefined;
	}

	clearLoginData(): IFuture<void> {
		return undefined;
	}
}
testInjector.register("userDataStore", MockUserDataStore);

class MockHttpClient implements Server.IHttpClient {
	public options: any;
	public mockResponse: Server.IResponse;
	public mockError: any;

	httpRequest(options: any): IFuture<Server.IResponse> {
		this.options = options;
		let future = new Future<Server.IResponse>();
		if (this.mockError) {
			future.throw(this.mockError);
		} else {
			future.return(this.mockResponse);
		}
		return future;
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
	return testInjector.resolve(ServiceUtil.ServiceProxy);
}

describe("ServiceProxy", () => {

	before(() => {
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.resolve("config").SOLUTION_SPACE_NAME = "MockedSolutionSpaceName";
	});
	it("calls api without arguments and expected return", () => {
		let proxy = makeProxy();

		httpClient.setResponse({});

		let result = proxy.call("test1", "GET", "authenticate", null, null, null).wait();

		assert.equal("GET", httpClient.options.method);
		assert.equal("/appbuilder/authenticate", httpClient.options.path);
		assert.notOk(result);

		assert.ok(httpClient.options.headers["X-Icenium-SolutionSpace"]);
		assert.equal(httpClient.options.headers.Cookie, "tlrkappshell=dummy");
	});

	it("calls api and returns JSON", () => {
		let expected = {a: "b", c: 4};

		let proxy = makeProxy();
		httpClient.setResponse({}, JSON.stringify(expected));

		let result = proxy.call("test2", "POST", "/json", "application/json", null, null).wait();

		assert.isObject(result);
		assert.deepEqual(result, expected);
	});

	it("calls api and pipes result to stream", () => {
		let proxy = makeProxy();
		httpClient.setResponse({}, null);

		let result = new (require("stream").PassThrough)();

		proxy.call("test3", "GET", "/package/zip", "application/octet-stream", null, result).wait();

		assert.strictEqual(httpClient.options.pipeTo, result);
	});

	it("throws error returned by HTTP client", () => {
		let proxy = makeProxy();
		httpClient.setResponse({}, null, new Error("404"));

		assert.throws(() => {
			proxy.call("test4", "GET", "/package/zip", "application/json", null, null).wait();
		}, "404");
	});
});
