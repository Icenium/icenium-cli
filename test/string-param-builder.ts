///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");
var testInjector = new yok.Yok();
import stubs = require("./stubs");
var configFile = require("../lib/config");
var assert = require("chai").assert;
var commandParams = require("../lib/common/command-params");

testInjector.register("errors", stubs.ErrorsStub);
testInjector.register("stringParameter", commandParams.StringCommandParameter);
testInjector.register("stringParameterBuilder", commandParams.StringParameterBuilder);
var stringParamBuilder = testInjector.resolve("stringParameterBuilder");

describe("StringParameterBuilder", () => {
	describe("createMandatoryParameter", () => {
		it("creates mandatory StringCommandParameter", () => {
			var stringParameter = stringParamBuilder.createMandatoryParameter("");
			assert.isTrue(stringParameter.mandatory);
			assert.equal("", stringParameter.errorMessage);
		});

		it("creates mandatory StringCommandParameter with specified errorMessage", () => {
			var errorMessage = "errorMessage";
			var stringParameter = stringParamBuilder.createMandatoryParameter(errorMessage);
			assert.isTrue(stringParameter.mandatory);
			assert.equal(errorMessage, stringParameter.errorMessage);
		});

		it("creates mandatory StringCommandParameter with undefined errorMessage", () => {
			var errorMessage: string = undefined;
			var stringParameter = stringParamBuilder.createMandatoryParameter(errorMessage);
			assert.isTrue(stringParameter.mandatory);
			assert.equal(errorMessage, stringParameter.errorMessage);
		});

		it("creates mandatory StringCommandParameter with null errorMessage", () => {
			var errorMessage: string = null;
			var stringParameter = stringParamBuilder.createMandatoryParameter(errorMessage);
			assert.isTrue(stringParameter.mandatory);
			assert.equal(errorMessage, stringParameter.errorMessage);
		});
	});
});