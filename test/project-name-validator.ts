///<reference path=".d.ts"/>
"use strict";

import chai = require("chai");
import yok = require("../lib/common/yok");
import stubs = require("./stubs");
var assert:chai.Assert = chai.assert;
import pnv = require("../lib/common/validators/project-name-validator");

describe("project-name-validator smoke tests", () => {

	var validator: IProjectNameValidator;
	before(() => {
		var testInjector = new yok.Yok();
		testInjector.register("errors", stubs.ErrorsStub);
		testInjector.register("projectNameValidator", "../lib/common/validators/project-name-validator");
		validator = testInjector.resolve("projectNameValidator");
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
		assert.ok(() => validator.validate("123"));
	});
});

