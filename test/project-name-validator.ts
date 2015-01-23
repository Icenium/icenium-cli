///<reference path=".d.ts"/>

import chai = require("chai");
import yok = require("../lib/common/yok");
import stubs = require("./stubs");
var assert:chai.Assert = chai.assert;

describe("project-name-validator smoke tests", () => {
	$injector.require("logger", "./common/logger");
	$injector.register("errors", stubs.ErrorsStub);
	$injector.register("jsonSchemaLoader", {});
	$injector.register("jsonSchemaResolver", {});
	$injector.require("jsonSchemaValidator", "../lib/json-schema/json-schema-validator");
	var validator = $injector.resolve("jsonSchemaValidator");

	it("invalid chars in the middle", () => {
		assert.throws(() => validator.validateProperty("ProjectName", "d@#z"));
	});

	it("invalid chars at start", () => {
		assert.throws(() => validator.validateProperty("ProjectName", "\\app"));
	});

	it("invalid chars at end", () => {
		assert.throws(() => validator.validateProperty("ProjectName", "app//"));
	});

	it("only numbers", () => {
		assert.ok(() => validator.validateProperty("ProjectName", "123"));
	});
});

