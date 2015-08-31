///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");
let testInjector = new yok.Yok();
import * as stubs from "./stubs";
let assert = require("chai").assert;
import * as commandParams from "../lib/common/command-params";

testInjector.register("errors", stubs.ErrorsStub);
testInjector.register("stringParameter", commandParams.StringCommandParameter);
testInjector.register("stringParameterBuilder", commandParams.StringParameterBuilder);
let stringParamBuilder = testInjector.resolve("stringParameterBuilder");

describe("StringParameterBuilder", () => {
	describe("createMandatoryParameter", () => {
		it("creates mandatory StringCommandParameter", () => {
			let stringParameter = stringParamBuilder.createMandatoryParameter("");
			assert.isTrue(stringParameter.mandatory);
			assert.equal("", stringParameter.errorMessage);
		});

		it("creates mandatory StringCommandParameter with specified errorMessage", () => {
			let errorMessage = "errorMessage";
			let stringParameter = stringParamBuilder.createMandatoryParameter(errorMessage);
			assert.isTrue(stringParameter.mandatory);
			assert.equal(errorMessage, stringParameter.errorMessage);
		});

		it("creates mandatory StringCommandParameter with undefined errorMessage", () => {
			let errorMessage: string = undefined;
			let stringParameter = stringParamBuilder.createMandatoryParameter(errorMessage);
			assert.isTrue(stringParameter.mandatory);
			assert.equal(errorMessage, stringParameter.errorMessage);
		});

		it("creates mandatory StringCommandParameter with null errorMessage", () => {
			let errorMessage: string = null;
			let stringParameter = stringParamBuilder.createMandatoryParameter(errorMessage);
			assert.isTrue(stringParameter.mandatory);
			assert.equal(errorMessage, stringParameter.errorMessage);
		});
	});
});
