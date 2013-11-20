"use strict";

var assert = require("assert");

describe("server", function() {
	var server = require("../lib/server");

	describe("basicLogin", function() {
		it("should log in using valid telerik credentials", function() {
			server.basicLogin("tailsu@gmail.com", "pDoVKoPCCRV", function(token) {
				assert.isNotNull(token, "is valid token");
				assert(token.length > 10, "is non-empty string");
			})
		})

		it("should return error when using invalid credentials", function() {
			server.basicLogin("nothing@example.org", "xxx", function(token) {
				assert.isUndefined(token);
			})
		})
	})
})