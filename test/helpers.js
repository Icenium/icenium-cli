"use strict";

var assert = require("chai").assert;

describe("helpers", function() {
	var helpers = require("../lib/helpers");
	describe("toHash", function() {
		it("converts array to hash", function() {
			var source = ["one", "two"];
			var result = helpers.toHash(source,
				function(value, key, source) { return value; },
				function(value, key, source) {
					return {key:key, value:value, source:source};
				});

			assert.equal(2, Object.keys(result).length);
			assert.isDefined(result.one);
			assert.isDefined(result.two);
			assert.equal(0, result.one.key);
			assert.equal("one", result.one.value);
			assert.equal(source, result.one.source);
			assert.equal(1, result.two.key);
			assert.equal("two", result.two.value);
			assert.equal(source, result.two.source);
		});

		it("converts hash to another hash", function() {
			var source = {one:1, two:2};
			var result = helpers.toHash(source,
				function(value, key, source) { return key; },
				function(value, key, source) {
					return {key:key, value:value, source:source};
				});

			assert.equal(2, Object.keys(result).length);
			assert.isDefined(result.one);
			assert.isDefined(result.two);
			assert.equal("one", result.one.key);
			assert.equal(1, result.one.value);
			assert.equal(source, result.one.source);
			assert.equal("two", result.two.key);
			assert.equal(2, result.two.value);
			assert.equal(source, result.two.source);
		});
	});
});