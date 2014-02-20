///<reference path=".d.ts"/>

import chai = require("chai");
import ServiceUtil = require("../lib/service-util");
import Future = require("fibers/future");
import stubs = require("./stubs");
import yok = require("../lib/yok");
var assert:chai.Assert = chai.assert;

var testInjector = new yok.Yok();
testInjector.register("logger", stubs.LoggerStub);

class MockUserDataStore implements IUserDataStore {

	hasCookie(): IFuture<boolean> {
		return Future.fromResult(false);
	}

	getCookie():IFuture<string> {
		return (() => "dummy").future<string>()();
	}

	getUser():IFuture<any> {
		return undefined;
	}

	setCookie(cookie:string):IFuture<void> {
		return undefined;
	}

	setUser(user):IFuture<void> {
		return undefined;
	}
}
testInjector.register("userDataStore", MockUserDataStore);

class MockHttpClient implements Server.IHttpClient {
	public options: any;
	public mockResponse: Server.IResponse;
	public mockError: any;

	httpRequest(options): IFuture<Server.IResponse> {
		this.options = options;
		return Future.wrap<Server.IResponse>((callback) => callback(this.mockError, this.mockResponse))();
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

var httpClient = new MockHttpClient();

testInjector.register("httpClient", httpClient);

function makeProxy(): Server.IServiceProxy {
	return testInjector.resolve(ServiceUtil.ServiceProxy);
}

describe("ServiceProxy", function () {

	before(function () {
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.resolve("config").SOLUTION_SPACE_NAME = "MockedSolutionSpaceName";
	});
	it("calls api without arguments and expected return", function() {
		var proxy = makeProxy();

		httpClient.setResponse({});

		var result = proxy.call("test1", "GET", "/authenticate", null, null, null).wait();

		assert.equal("GET", httpClient.options.method);
		assert.equal("/api/authenticate", httpClient.options.path);
		assert.notOk(result);

		assert.ok(httpClient.options.headers["X-Icenium-SolutionSpace"]);
		assert.equal(httpClient.options.headers.Cookie, ".ASPXAUTH=dummy");
	});

	it("calls api and returns JSON", function() {
		var expected = {a: "b", c: 4};

		var proxy = makeProxy();
		httpClient.setResponse({}, JSON.stringify(expected));

		var result = proxy.call("test2", "POST", "/json", "application/json", null, null).wait();

		assert.isObject(result);
		assert.deepEqual(result, expected);
	});

	it("calls api and pipes result to stream", function() {
		var proxy = makeProxy();
		httpClient.setResponse({}, null);

		var result = new (require("stream").PassThrough)();

		proxy.call("test3", "GET", "/package/zip", "application/octet-stream", null, result);

		assert.strictEqual(httpClient.options.pipeTo, result);
	});

	it("throws error returned by HTTP client", function() {
		var proxy = makeProxy();
		httpClient.setResponse({}, null, new Error("404"));

		assert.throws(function() {
			proxy.call("test4", "GET", "/package/zip", "application/json", null, null).wait();
		}, "404");
	});
});
