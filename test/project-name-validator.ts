///<reference path=".d.ts"/>
"use strict";

import chai = require("chai");
import yok = require("../lib/common/yok");
import stubs = require("./stubs");
let assert:chai.Assert = chai.assert;
import pnv = require("../lib/common/validators/project-name-validator");

describe("project-name-validator smoke tests", () => {

	let validator: IProjectNameValidator;
	before(() => {
		let testInjector = new yok.Yok();
		testInjector.register("errors", stubs.ErrorsStub);
		validator = testInjector.resolve(pnv.ProjectNameValidator);
	});

	it("invalid chars in the middle", () => {
		assert.throws(() => validator.validate("d@#z"));
	});

	it("invalid chars at start", () => {
		assert.throws(() => validator.validate("\\app"));
	});

	it("invalid chars at end", () => {
		assert.throws(() => validator.validate("app//"));
	});

	it("only numbers", () => {
		assert.strictEqual(true, validator.validate("123"));
	});

	it("invalid length", () => {
		assert.throws(() => validator.validate("Thirtyone character long string"));
	});
});

