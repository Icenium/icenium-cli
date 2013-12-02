"use strict";

var assert = require("chai").assert;

describe("server", function() {
	var server = require("../lib/server");

	describe("basicLogin", function() {
		it("should log in using valid telerik credentials", function(done) {
			this.timeout(10000);
			server.basicLogin("tailsu@gmail.com", "pDoVKoPCCRV4", function(err, token) {
				assert.isString(token, "is valid token");
				assert.isNull(err);
				done();
			});
		});

		it("should return error when using invalid credentials", function(done) {
			this.timeout(10000);
			server.basicLogin("nothing@example.org", "xxx", function(err, token) {
				assert.notOk(token);
				assert.isNotNull(err);
				done();
			});
		});
	});
});