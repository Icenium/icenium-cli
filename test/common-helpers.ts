///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
var assert = require("chai").assert;


describe("common helpers", () => {
	describe("remove<T>",() => {
		it("removes single element from array correctly", () => {
			var array = [1, 2, 3];
			var removed = helpers.remove(array, n => n === 1);

			var message = 'Item not removed correctly';
			assert.strictEqual(array.length, 2, message);
			assert.strictEqual(removed.length, 1, message);
			assert.deepEqual(array, [2, 3], message);
		});

		it("removes more elements from array when specified", () => {
			var array = [1, 2, 3];
			var removed = helpers.remove(array, n => n === 1, 2);

			var message = 'One or more elements not removed correctly';
			assert.strictEqual(array.length, 1, message);
			assert.strictEqual(removed.length, 2, message);
			assert.deepEqual(array, [3], message);
			assert.deepEqual(removed, [1, 2], message);
		});

		it("does not remove any elements from array when condition not met", () => {
			var array = [1, 2, 3];
			var removed = helpers.remove(array, n => n === 4);

			var message = 'One or more elements removed incorrectly';
			assert.strictEqual(array.length, 3, message);
			assert.strictEqual(removed.length, 0, message);
			assert.deepEqual(array, [1, 2, 3], message);
			assert.deepEqual(removed, [], message);
		});

		it("removes single element from array when multiple identical items present", () => {
			var array = [1, 2, 3, 1];
			var removed = helpers.remove(array, n => n === 1);

			var message = 'More than one items removed incorrectly';
			assert.strictEqual(array.length, 3, message);
			assert.strictEqual(removed.length, 1, message);
			assert.deepEqual(array, [2, 3, 1], message);
			assert.deepEqual(removed, [1], message);
		});

		it("removed elements are of the same type as the original elements", () => {
			var array: number[] = [1, 2, 3];
			var removed = helpers.remove(array, n => n === 1);

			var message = 'Types do not match';
			assert.strictEqual(typeof removed[0], 'number', message);
		});
	});
});