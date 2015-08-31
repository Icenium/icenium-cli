///<reference path=".d.ts"/>
"use strict";

import * as helpers from "../lib/helpers";
import {assert} from "chai";

describe("helpers", () => {
	describe("toHash", () => {
		it("converts array to hash", () => {
			let source = ["one", "two"];
			let result:any = helpers.toHash(source, (value) => value, (value, key, _source) => {
					return {key: key, value: value, source: _source};
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

		it("converts hash to another hash", () => {
			let source = {one:1, two:2};
			let result:any = helpers.toHash(source, (value, key) => key,
				(value, key, _source) => {
					return {key: key, value: value, source: _source};
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

	describe("findByNameOrIndex", () => {
		it("should find exact name match", () => {
			let source = [{name: "Foo 1"}, {name: "Foo"}];
			let result = helpers.findByNameOrIndex("Foo", source, (e) => e.name);
			assert.equal(result.name, "Foo");
		});

		it("should find name by prefix", () => {
			let source = [{name: "AaBb"}, {name: "Bb"}];
			let result = helpers.findByNameOrIndex("Bb", source, (e) => e.name);
			assert.equal(result.name, "Bb");
		});

		it("should not find name by substring", () => {
			let source = [{name: "Foo 10"}];
			let result = helpers.findByNameOrIndex("10", source, (e) => e.name);
			assert.notOk(result);
		});

		it("should find element by index", () => {
			let source = [{name: "Foo 2"}, {name: "Foo 3"}, {name: "Foo 4"}];
			let result = helpers.findByNameOrIndex("2", source, (e) => e.name);
			assert.equal(result.name, "Foo 3");
		});

		it("should find element by index with pound sign", () => {
			let source = [{name: "2"}, {name: "3"}];
			let result = helpers.findByNameOrIndex("#2", source, (e) => e.name);
			assert.equal(result.name, "3");
		});
	});

	describe("formatListOfNames", () => {
		it("should format one name", () => {
			assert.equal("foo", helpers.formatListOfNames(["foo"]));
		});

		it("should format list of two names", () => {
			assert.equal("foo or bar", helpers.formatListOfNames(["foo", "bar"]));
		});

		it("should format list of multiple names", () => {
			assert.equal("foo, bar, baz or jazz", helpers.formatListOfNames(["foo", "bar", "baz", "jazz"]));
		});
	});

	describe("mergeRecursive", () => {
		it("should merge one level objects with different properties", () => {
			assert.deepEqual({ a: 1, b: 2, c: 3, d: 4 }, helpers.mergeRecursive({a: 1, b: 2}, {c: 3, d: 4}));
		});
		it("should merge one level objects with same properties", () => {
			assert.deepEqual({ a: 10, b: 20, c: 30, d: 40 }, helpers.mergeRecursive({a: 1, b: 2, c: 3, d: 4}, {a: 10, b: 20, c: 30, d: 40}));
		});
		it("should merge deep objects", () => {
			assert.deepEqual({ a: 10, b: {c: 1, d: 2}}, helpers.mergeRecursive({a: 1, b: {c: 1}}, {a: 10, b: {d: 2}}));
		});
		it("should merge very deep objects", () => {
			assert.deepEqual({ a: 10, b: {c: { d: { e: { f: { g: { h: 100}}}}}}}, helpers.mergeRecursive({ a: 10, b: {c: { d: { e: { f: { g: { h: 1}}}}}}}, { a: 10, b: {c: { d: { e: { f: { g: { h: 100}}}}}}}));
		});
		it("should merge deep objects with different root property", () => {
			assert.deepEqual({ a: { b: { c: 10 }, d: { e: { f: 10}, k : {}}}, k: { l: { m: { n: { p: 1}}}}}, helpers.mergeRecursive({ a: { b: { c: 10 }, d: { e: { f: 10}, k : {}}}}, { k: { l: { m: { n: { p: 1}}}}}));
		});
	});

	describe("versionCompare", () => {
		it("should throw error on non-matching versions", () => {
			assert.throws(() => helpers.versionCompare("1.1.1", "1.1"));
			assert.throws(() => helpers.versionCompare("1.1", "1.1.1"));
		});

		it("should compare in order of subversions", () => {
			assert.equal(1, helpers.versionCompare("10.1.5", "1.10.5"));
			assert.equal(-1, helpers.versionCompare("1.10.5", "10.1.5"));
		});

		it("should compare all subversions if first couple are equal", () => {
			assert.equal(1, helpers.versionCompare("1.1.10.1.5", "1.1.1.10.5"));
			assert.equal(-1, helpers.versionCompare("1.1.1.10.5", "1.1.10.1.5"));
		});

		it("should return zero if versions are equal", () => {
			let version = "123.456.789";
			assert.equal(0, helpers.versionCompare(version, version));
		});

		it("should return correctly for ice server versions", () => {
			assert.equal(1, helpers.versionCompare("2014.1.403.0", "0.0.0.0"));
			assert.equal(-1, helpers.versionCompare("2014.1.403.0", "2014.1.601.0"));
		});
	});
});
