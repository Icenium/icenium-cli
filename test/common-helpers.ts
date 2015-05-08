///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
let assert = require("chai").assert;


describe("common helpers", () => {
	describe("remove<T>",() => {
		it("removes single element from array correctly", () => {
			let array = [1, 2, 3];
			let removed = helpers.remove(array, n => n === 1);

			let message = 'Item not removed correctly';
			assert.strictEqual(array.length, 2, message);
			assert.strictEqual(removed.length, 1, message);
			assert.deepEqual(array, [2, 3], message);
		});

		it("removes more elements from array when specified", () => {
			let array = [1, 2, 3];
			let removed = helpers.remove(array, n => n === 1, 2);

			let message = 'One or more elements not removed correctly';
			assert.strictEqual(array.length, 1, message);
			assert.strictEqual(removed.length, 2, message);
			assert.deepEqual(array, [3], message);
			assert.deepEqual(removed, [1, 2], message);
		});

		it("does not remove any elements from array when condition not met", () => {
			let array = [1, 2, 3];
			let removed = helpers.remove(array, n => n === 4);

			let message = 'One or more elements removed incorrectly';
			assert.strictEqual(array.length, 3, message);
			assert.strictEqual(removed.length, 0, message);
			assert.deepEqual(array, [1, 2, 3], message);
			assert.deepEqual(removed, [], message);
		});

		it("removes single element from array when multiple identical items present", () => {
			let array = [1, 2, 3, 1];
			let removed = helpers.remove(array, n => n === 1);

			let message = 'More than one items removed incorrectly';
			assert.strictEqual(array.length, 3, message);
			assert.strictEqual(removed.length, 1, message);
			assert.deepEqual(array, [2, 3, 1], message);
			assert.deepEqual(removed, [1], message);
		});

		it("removed elements are of the same type as the original elements", () => {
			let array: number[] = [1, 2, 3];
			let removed = helpers.remove(array, n => n === 1);

			let message = 'Types do not match';
			assert.strictEqual(typeof removed[0], 'number', message);
		});
	});
});