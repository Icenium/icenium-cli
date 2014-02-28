///<reference path="./.d.ts"/>
"use strict";

require("./../lib/extensions");
import yok = require("./../lib/yok");
import stubs = require("./stubs");
import Future = require("fibers/future");
import util = require("util");
import helpers = require("./../lib/helpers");
import validatorsModule = require("./../lib/validators/cryptographic-identity-validators");
import commandsModule = require("./../lib/commands/cryptographic-identities");
var assert = require("chai").assert;

function createTestInjector(): IInjector {
	require("../lib/logger");

	var testInjector = new yok.Yok();
	testInjector.register("injector", testInjector);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("errors", stubs.ErrorsStub);

	return testInjector;
}

describe("Create self signed identity unit tests", function() {
	var selfSignedIdentityValidator, testInjector;
	before(() => {
		testInjector = createTestInjector();
		testInjector.register("selfSignedIdentityValidator", validatorsModule.SelfSignedIdentityValidator);
		selfSignedIdentityValidator = testInjector.resolve("selfSignedIdentityValidator");

		helpers.getCountries = () => ["Dummyland"];
	});

	describe("SelfSignedIdentityValidator unit tests", () => {
		it("validates that Name, Email, Country, StartDate and EndDate are set and valid", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isTrue(validationResult.IsSuccessful);
		});

		it("validates that Name is missing", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: undefined,
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Name"));
		});

		it("validates that Email is missing", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: undefined,
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Email"));
		});

		it("validates that Country is missing", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: undefined,
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		});

		it("validates that Country is invalid", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "TheLand",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, util.format(validatorsModule.SelfSignedIdentityValidator.
				INVALID_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		});

		it("validates that StartDate is missing", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: undefined,
				EndDate: "2010-02-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "StartDate"));
		});

		it("validates that EndDate is missing", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: undefined
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "EndDate"));
		});

		it("validates that Expiration time is negative", () => {
			var model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-01-02"
			};

			var validationResult = selfSignedIdentityValidator.validate(model);
			assert.isFalse(validationResult.IsSuccessful);
			assert.equal(validationResult.Error, validatorsModule.SelfSignedIdentityValidator.NEGATIVE_EXPIRATION_ERROR_MESSAGE);
		});
	});
})
