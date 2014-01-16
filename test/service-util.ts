///<reference path=".d.ts"/>

import chai = require("chai");
import ServiceUtil = require("../lib/service-util");
var assert:chai.Assert = chai.assert;

class MockHttpClient implements Server.IHttpClient {
	public options: any;
	public mockResponse: Server.IResponse;

	httpRequest(options):Server.IResponse {
		this.options = options;
		return this.mockResponse;
	}

	public setResponse(headers: any, body?: any, error?: any) {
		this.mockResponse = {
			response: {},
			headers: headers,
			body: body,
			error: error
		};
	}
}

var httpClient = new MockHttpClient();

$injector.register("httpClient", httpClient);

class MockLoginManager implements ILoginManager {
	getCookie():string {
		return "dummy";
	}
}

$injector.register("loginManager", new MockLoginManager());

function makeProxy(): Server.IServiceProxy {
	return <Server.IServiceProxy> $injector.resolve(ServiceUtil.ServiceProxy);
}

describe("ServiceProxy", function() {
	it("calls api without arguments and expected return", function() {
		var proxy = makeProxy();

		httpClient.setResponse({});

		var result = proxy.call("GET", "/authenticate", null, null, null);

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

		var result = proxy.call("POST", "/json", "application/json", null, null);

		assert.isObject(result);
		assert.deepEqual(result, expected);
	});

	it("calls api and pipes result to stream", function() {
		var proxy = makeProxy();
		httpClient.setResponse({}, null);

		var result = new (require("stream").PassThrough)();

		proxy.call("GET", "/package/zip", "application/octet-stream", null, result);

		assert.strictEqual(httpClient.options.pipeTo, result);
	});

	it("throws error returned by HTTP client", function() {
		var proxy = makeProxy();
		httpClient.setResponse({}, null, new Error("404"));

		assert.throws(function() {
			proxy.call("GET", "/package/zip", "application/json", null, null);
		}, "404");
	});
});
