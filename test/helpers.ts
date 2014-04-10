///<reference path=".d.ts"/>

"use strict";

import helpers = require("../lib/helpers");

var assert = require("chai").assert;

describe("helpers", function() {
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

	describe("findByNameOrIndex", function() {
		it("should find exact name match", function() {
			var source = [{name: "Foo 1"}, {name: "Foo"}];
			var result = helpers.findByNameOrIndex("Foo", source, (e) => e.name);
			assert.equal(result.name, "Foo");
		});

		it("should find name by prefix", function() {
			var source = [{name: "AaBb"}, {name: "Bb"}];
			var result = helpers.findByNameOrIndex("Bb", source, (e) => e.name);
			assert.equal(result.name, "Bb");
		});

		it("should not find name by substring", function() {
			var source = [{name: "Foo 10"}];
			var result = helpers.findByNameOrIndex("10", source, (e) => e.name);
			assert.notOk(result);
		});

		it("should find element by index", function() {
			var source = [{name: "Foo 2"}, {name: "Foo 3"}, {name: "Foo 4"}];
			var result = helpers.findByNameOrIndex("2", source, (e) => e.name);
			assert.equal(result.name, "Foo 3");
		});

		it("should find element by index with pound sign", function() {
			var source = [{name: "2"}, {name: "3"}];
			var result = helpers.findByNameOrIndex("#2", source, (e) => e.name);
			assert.equal(result.name, "3");
		})
	});

	describe("formatListOfNames", function() {
		it("should format one name", function() {
			assert.equal("foo", helpers.formatListOfNames(["foo"]));
		});

		it("should format list of two names", function() {
			assert.equal("foo or bar", helpers.formatListOfNames(["foo", "bar"]));
		});

		it("should format list of multiple names", function() {
			assert.equal("foo, bar, baz or jazz", helpers.formatListOfNames(["foo", "bar", "baz", "jazz"]));
		});
	});

	describe("mergeRecursive", function() {
		it("should merge one level objects with different properties", function() {
			assert.deepEqual({ a: 1, b: 2, c: 3, d: 4 }, helpers.mergeRecursive({a: 1, b: 2}, {c: 3, d: 4}));
		});
		it("should merge one level objects with same properties", function() {
			assert.deepEqual({ a: 10, b: 20, c: 30, d: 40 }, helpers.mergeRecursive({a: 1, b: 2, c: 3, d: 4}, {a: 10, b: 20, c: 30, d: 40}));
		});
		it("should merge deep objects", function() {
			assert.deepEqual({ a: 10, b: {c: 1, d: 2}}, helpers.mergeRecursive({a: 1, b: {c: 1}}, {a: 10, b: {d: 2}}));
		});
		it("should merge very deep objects", function() {
			assert.deepEqual({ a: 10, b: {c: { d: { e: { f: { g: { h: 100}}}}}}}, helpers.mergeRecursive({ a: 10, b: {c: { d: { e: { f: { g: { h: 1}}}}}}}, { a: 10, b: {c: { d: { e: { f: { g: { h: 100}}}}}}}));
		});
		it("should merge deep objects with different root property", function() {
			assert.deepEqual({ a: { b: { c: 10 }, d: { e: { f: 10}, k : {}}}, k: { l: { m: { n: { p: 1}}}}}, helpers.mergeRecursive({ a: { b: { c: 10 }, d: { e: { f: 10}, k : {}}}}, { k: { l: { m: { n: { p: 1}}}}}));
		});
	})

	describe("versionCompare", function () {
		it("should throw error on non-matching versions", function () {
			assert.throws(function () { helpers.versionCompare("1.1.1", "1.1") });
			assert.throws(function () { helpers.versionCompare("1.1", "1.1.1") });
		});

		it("should compare in order of subversions", function () {
			assert.equal(1, helpers.versionCompare("10.1.5", "1.10.5"));
			assert.equal(-1, helpers.versionCompare("1.10.5", "10.1.5"));
		});

		it("should compare all subversions if first couple are equal", function () {
			assert.equal(1, helpers.versionCompare("1.1.10.1.5", "1.1.1.10.5"));
			assert.equal(-1, helpers.versionCompare("1.1.1.10.5", "1.1.10.1.5"));
		});

		it("should return zero if versions are equal", function () {
			var version = "123.456.789";
			assert.equal(0, helpers.versionCompare(version, version));
		});

		it("should return correctly for ice server versions", function () {
			assert.equal(1, helpers.versionCompare("2014.1.403.0", "0.0.0.0"));
			assert.equal(-1, helpers.versionCompare("2014.1.403.0", "2014.1.601.0"));
		});
	})
});