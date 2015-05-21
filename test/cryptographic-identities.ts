///<reference path="./.d.ts"/>
"use strict";

import yok = require("./../lib/common/yok");
import stubs = require("./stubs");
import Future = require("fibers/future");
import util = require("util");
import helpers = require("./../lib/helpers");
import validatorsModule = require("./../lib/validators/cryptographic-identity-validators");
import logger = require("../lib/common/logger");
import commandsModule = require("./../lib/commands/cryptographic-identities");
import hostInfoLib = require("./../lib/common/host-info");
import x509 = require("./../lib/x509");
import assert = require("assert");
let todaysTime = new Date().getTime(),
	tomorrow = new Date(todaysTime + 24 * 60 * 60 * 1000),
	yesterday = new Date(todaysTime - 24 * 60 * 60 * 1000);

function createTestInjector(provisions?: IProvision[], identities?: ICryptographicIdentity[]): IInjector {
	let testInjector = new yok.Yok();
	let x509Loader = testInjector.resolve(x509.X509CertificateLoader);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("x509", {
		load: () => x509Loader.load,
		expiresOn: () => tomorrow
	});
	testInjector.register("logger", logger);

	testInjector.register("selfSignedIdentityValidator", validatorsModule.SelfSignedIdentityValidator);
	testInjector.register("identityManager", commandsModule.IdentityManager);
	testInjector.register("cryptographicIdentityStoreService", {
		getAllProvisions: () => {
			return (() => {
				return provisions;
			}).future<IProvision[]>()();
		},
		getAllIdentities: () => {
			return (() => {
				return identities;
			}).future<ICryptographicIdentity[]>()();
		}
	});
	testInjector.register("injector", testInjector);
	testInjector.register("options", {});
	testInjector.register("hostInfo", hostInfoLib.HostInfo);

	return testInjector;
}

describe("Create self signed identity unit tests", () => {
	let selfSignedIdentityValidator: IValidator<ISelfSignedIdentityModel>, testInjector: IInjector;
	before(() => {
		testInjector = createTestInjector();
		selfSignedIdentityValidator = testInjector.resolve("selfSignedIdentityValidator");

		helpers.getCountries = () => ["Dummyland"];
	});

	describe("SelfSignedIdentityValidator unit tests", () => {
		it("validates that Name, Email, Country, StartDate and EndDate are set and valid", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, true);
		});

		it("validates that Name is missing", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: undefined,
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Name"));
		});

		it("validates that Email is missing", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: undefined,
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Email"));
		});

		it("validates that Country is missing", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: undefined,
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		});

		it("validates that Country is invalid", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "TheLand",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-02-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, util.format(validatorsModule.SelfSignedIdentityValidator.
				INVALID_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		});

		it("validates that StartDate is missing", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: undefined,
				EndDate: "2010-02-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "StartDate"));
		});

		it("validates that EndDate is missing", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: undefined
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, util.format(validatorsModule.SelfSignedIdentityValidator.
				EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "EndDate"));
		});

		it("validates that Expiration time is negative", () => {
			let model = <ISelfSignedIdentityModel>{
				Name: "Dummy",
				Email: "dummy@foo.com",
				Country: "Dummyland",
				ForGooglePlayPublishing: "false",
				StartDate: "2010-02-02",
				EndDate: "2010-01-02"
			};

			let validationResult = selfSignedIdentityValidator.validate(model);
			assert.deepEqual(validationResult.isSuccessful, false);
			assert.deepEqual(validationResult.error, validatorsModule.SelfSignedIdentityValidator.NEGATIVE_EXPIRATION_ERROR_MESSAGE);
		});
	});
})

describe("IdentityManager unit tests", () => {
	let testInjector: IInjector,
		service: Server.IIdentityManager,
		provision: IProvision,
		certificate: ICryptographicIdentity;

	beforeEach(() => {
		provision = {
			Name: "Valid AdHoc Provision",
			Identifier: "R58QAA9NR8",
			ApplicationIdentifierPrefix: "R58QAA9NR8",
			ApplicationIdentifier: "*",
			ProvisionType: "AdHoc",
			ExpirationDate: tomorrow,
			Certificates: ["MIIFlTCCBH2gAwIBAgIIJd9AYEgZv7cwDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTMxMTE5MTU0NTMwWhcNMTQxMTE5MTU0NTMwWjCBiDEaMBgGCgmSJomT8ixkAQEMCk1XSjJBOFg1VTcxMjAwBgNVBAMMKWlQaG9uZSBEZXZlbG9wZXI6IEljZW5pdW0gUUEgKFE3VldEOTlMN0opMRMwEQYDVQQLDApDSFNRM00zUDM3MRQwEgYDVQQKDAtUZWxlcmlrIEEgRDELMAkGA1UEBhMCQkcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCBjqn7ecjcfreSDOWWnW3peAScaQf6Fq9SPtnSPlXsJVepXy1v97+gjZW6FqJyg/Ya3861TkspOigaikU+A6+4E3gQPLQc/a2wyQetNPrn8grHS7S4LFNT5r9P8uXLTWs9K6O3NLykWc+z9YXfNevuP4nW7Udw2QHTl0h7O0OElrM4k7vQREd/PZ0WRrz6UT5xAnGpKs+hRBbtfJOqjYQAc5R0xHQiQXLg0Fb6GPpg6tQTSBuEkkkgZOWEOgeRBZVHuy41t7U3+3dk5/M74/1BJY5iUFKOrxgrXoh7jTKz5VXswpGks84y2+mgie4ShEvw5aG/715GsJwxQksxU+JRAgMBAAGjggHxMIIB7TAdBgNVHQ4EFgQULykbwRyB9wkl6QYQgc882QzbGvgwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAQ8GA1UdIASCAQYwggECMIH/BgkqhkiG92NkBQEwgfEwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wKQYIKwYBBQUHAgEWHWh0dHA6Ly93d3cuYXBwbGUuY29tL2FwcGxlY2EvME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2NlcnRpZmljYXRpb25hdXRob3JpdHkvd3dkcmNhLmNybDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMwEwYKKoZIhvdjZAYBAgEB/wQCBQAwDQYJKoZIhvcNAQEFBQADggEBAHArF3TTTPWRIkbMBeXg5REFFkZmR1vL0OSqWl59eNLXdv/qgIDbHTfGoyjB6yJygLH0N2ZpbbnAtU2OtGUYDLd+ouJdqv2TORiHMC7DcvKJSVm8aPrdjJWdWy+46aI45jgPTdwKCpNuuWgjun7BwXkQL8TYLqBpb3Nu1VJYlG1esTi6VMGyfxbbpdND8fWm13Wc9Dc204mLOoinATAiXNvsS4cm2k1kNQLhSazOQ6rpxjVFRWnryKGfLHXbZ7DJjIrOvvFCHmJmhFUiunc4aH6xCrCBe2iyX5BMC4N+daIjs6ufSXdW0tbBlox1EcXMrTV6GrdSIEHlLvAfZpeFmQc="],
			ProvisionedDevices: ['']
		};

		certificate = {
			Alias: "AdHoc Certificate",
			Attributes: [''],
			isiOS: true,
			Certificate: "-----BEGIN CERTIFICATE-----\r\nMIIFlTCCBH2gAwIBAgIIJd9AYEgZv7cwDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNV\r\nBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3Js\r\nZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3\r\naWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkw\r\nHhcNMTMxMTE5MTU0NTMwWhcNMTQxMTE5MTU0NTMwWjCBiDEaMBgGCgmSJomT8ixk\r\nAQEMCk1XSjJBOFg1VTcxMjAwBgNVBAMMKWlQaG9uZSBEZXZlbG9wZXI6IEljZW5p\r\ndW0gUUEgKFE3VldEOTlMN0opMRMwEQYDVQQLDApDSFNRM00zUDM3MRQwEgYDVQQK\r\nDAtUZWxlcmlrIEEgRDELMAkGA1UEBhMCQkcwggEiMA0GCSqGSIb3DQEBAQUAA4IB\r\nDwAwggEKAoIBAQCBjqn7ecjcfreSDOWWnW3peAScaQf6Fq9SPtnSPlXsJVepXy1v\r\n97+gjZW6FqJyg/Ya3861TkspOigaikU+A6+4E3gQPLQc/a2wyQetNPrn8grHS7S4\r\nLFNT5r9P8uXLTWs9K6O3NLykWc+z9YXfNevuP4nW7Udw2QHTl0h7O0OElrM4k7vQ\r\nREd/PZ0WRrz6UT5xAnGpKs+hRBbtfJOqjYQAc5R0xHQiQXLg0Fb6GPpg6tQTSBuE\r\nkkkgZOWEOgeRBZVHuy41t7U3+3dk5/M74/1BJY5iUFKOrxgrXoh7jTKz5VXswpGk\r\ns84y2+mgie4ShEvw5aG/715GsJwxQksxU+JRAgMBAAGjggHxMIIB7TAdBgNVHQ4E\r\nFgQULykbwRyB9wkl6QYQgc882QzbGvgwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAW\r\ngBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAQ8GA1UdIASCAQYwggECMIH/BgkqhkiG\r\n92NkBQEwgfEwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0\r\naWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0\r\naGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2Yg\r\ndXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3Rp\r\nY2Ugc3RhdGVtZW50cy4wKQYIKwYBBQUHAgEWHWh0dHA6Ly93d3cuYXBwbGUuY29t\r\nL2FwcGxlY2EvME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9kZXZlbG9wZXIuYXBw\r\nbGUuY29tL2NlcnRpZmljYXRpb25hdXRob3JpdHkvd3dkcmNhLmNybDAOBgNVHQ8B\r\nAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMwEwYKKoZIhvdjZAYBAgEB\r\n/wQCBQAwDQYJKoZIhvcNAQEFBQADggEBAHArF3TTTPWRIkbMBeXg5REFFkZmR1vL\r\n0OSqWl59eNLXdv/qgIDbHTfGoyjB6yJygLH0N2ZpbbnAtU2OtGUYDLd+ouJdqv2T\r\nORiHMC7DcvKJSVm8aPrdjJWdWy+46aI45jgPTdwKCpNuuWgjun7BwXkQL8TYLqBp\r\nb3Nu1VJYlG1esTi6VMGyfxbbpdND8fWm13Wc9Dc204mLOoinATAiXNvsS4cm2k1k\r\nNQLhSazOQ6rpxjVFRWnryKGfLHXbZ7DJjIrOvvFCHmJmhFUiunc4aH6xCrCBe2iy\r\nX5BMC4N+daIjs6ufSXdW0tbBlox1EcXMrTV6GrdSIEHlLvAfZpeFmQc=\r\n-----END CERTIFICATE-----\r\n"
		}
	});

	describe("autoselectProvision unit tests", () => {
		it("should throw if no provisions", () => {
			let testInjector = createTestInjector([]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.throws(() => service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), 'No exception thrown when no provision found');
		});

		it("should throw if no certificates", () => {
			let testInjector = createTestInjector([provision], []);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.throws(() => service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), 'No exception thrown when no suitable certificate found');
		});

		it("should throw if provision is expired", () => {
			let testInjector = createTestInjector([provision], []);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.throws(() => service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), 'No exception thrown when provision expired');
		});

		it("should throw if AdHoc provision does not contain given device identifier", () => {
			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.throws(() => service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc'], 'device1').wait(), "No exception thrown when given device identifier not present in mobile provision");
		});

		it("should select AdHoc provision when valid certificate present", () => {
			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), provision, "Failed to select mobile provision when only one valid was present");
		});

		it("should select App Store provision when valid certificate present", () => {
			provision.ProvisionType = "App Store";

			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['App Store']).wait(), provision, "Failed to select mobile provision when only one valid was present");
		});

		it("should select correct provision when multiple provisions present and others have invalid identifier", () => {
			let provisions: IProvision[] = [{
				Name: "Invalid AdHoc Provision",
				Identifier: "R58QAA9NR8",
				ApplicationIdentifierPrefix: "R58QAA9NR8",
				ApplicationIdentifier: "com.telerik.WillSetLater.invalid",
				ProvisionType: "AdHoc",
				ExpirationDate: tomorrow,
				Certificates: ["MIIFlTCCBH2gAwIBAgIIJd9AYEgZv7cwDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTMxMTE5MTU0NTMwWhcNMTQxMTE5MTU0NTMwWjCBiDEaMBgGCgmSJomT8ixkAQEMCk1XSjJBOFg1VTcxMjAwBgNVBAMMKWlQaG9uZSBEZXZlbG9wZXI6IEljZW5pdW0gUUEgKFE3VldEOTlMN0opMRMwEQYDVQQLDApDSFNRM00zUDM3MRQwEgYDVQQKDAtUZWxlcmlrIEEgRDELMAkGA1UEBhMCQkcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCBjqn7ecjcfreSDOWWnW3peAScaQf6Fq9SPtnSPlXsJVepXy1v97+gjZW6FqJyg/Ya3861TkspOigaikU+A6+4E3gQPLQc/a2wyQetNPrn8grHS7S4LFNT5r9P8uXLTWs9K6O3NLykWc+z9YXfNevuP4nW7Udw2QHTl0h7O0OElrM4k7vQREd/PZ0WRrz6UT5xAnGpKs+hRBbtfJOqjYQAc5R0xHQiQXLg0Fb6GPpg6tQTSBuEkkkgZOWEOgeRBZVHuy41t7U3+3dk5/M74/1BJY5iUFKOrxgrXoh7jTKz5VXswpGks84y2+mgie4ShEvw5aG/715GsJwxQksxU+JRAgMBAAGjggHxMIIB7TAdBgNVHQ4EFgQULykbwRyB9wkl6QYQgc882QzbGvgwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAQ8GA1UdIASCAQYwggECMIH/BgkqhkiG92NkBQEwgfEwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wKQYIKwYBBQUHAgEWHWh0dHA6Ly93d3cuYXBwbGUuY29tL2FwcGxlY2EvME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2NlcnRpZmljYXRpb25hdXRob3JpdHkvd3dkcmNhLmNybDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMwEwYKKoZIhvdjZAYBAgEB/wQCBQAwDQYJKoZIhvcNAQEFBQADggEBAHArF3TTTPWRIkbMBeXg5REFFkZmR1vL0OSqWl59eNLXdv/qgIDbHTfGoyjB6yJygLH0N2ZpbbnAtU2OtGUYDLd+ouJdqv2TORiHMC7DcvKJSVm8aPrdjJWdWy+46aI45jgPTdwKCpNuuWgjun7BwXkQL8TYLqBpb3Nu1VJYlG1esTi6VMGyfxbbpdND8fWm13Wc9Dc204mLOoinATAiXNvsS4cm2k1kNQLhSazOQ6rpxjVFRWnryKGfLHXbZ7DJjIrOvvFCHmJmhFUiunc4aH6xCrCBe2iyX5BMC4N+daIjs6ufSXdW0tbBlox1EcXMrTV6GrdSIEHlLvAfZpeFmQc="],
				ProvisionedDevices: ['']
			},
			provision];

			let testInjector = createTestInjector(provisions, [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), provision, "Failed to select mobile provision with appropriate application identifier");
		});

		it("should select correct provision when multiple provisions present and others have different type", () => {
			let provisionType = 'Development';
			provision.ProvisionType = provisionType

			let provisions: IProvision[] = [{
				Name: "Invalid AdHoc Provision",
				Identifier: "R58QAA9NR8",
				ApplicationIdentifierPrefix: "R58QAA9NR8",
				ApplicationIdentifier: "com.telerik.WillSetLater.invalid",
				ProvisionType: "AdHoc",
				ExpirationDate: tomorrow,
				Certificates: ["MIIFlTCCBH2gAwIBAgIIJd9AYEgZv7cwDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTMxMTE5MTU0NTMwWhcNMTQxMTE5MTU0NTMwWjCBiDEaMBgGCgmSJomT8ixkAQEMCk1XSjJBOFg1VTcxMjAwBgNVBAMMKWlQaG9uZSBEZXZlbG9wZXI6IEljZW5pdW0gUUEgKFE3VldEOTlMN0opMRMwEQYDVQQLDApDSFNRM00zUDM3MRQwEgYDVQQKDAtUZWxlcmlrIEEgRDELMAkGA1UEBhMCQkcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCBjqn7ecjcfreSDOWWnW3peAScaQf6Fq9SPtnSPlXsJVepXy1v97+gjZW6FqJyg/Ya3861TkspOigaikU+A6+4E3gQPLQc/a2wyQetNPrn8grHS7S4LFNT5r9P8uXLTWs9K6O3NLykWc+z9YXfNevuP4nW7Udw2QHTl0h7O0OElrM4k7vQREd/PZ0WRrz6UT5xAnGpKs+hRBbtfJOqjYQAc5R0xHQiQXLg0Fb6GPpg6tQTSBuEkkkgZOWEOgeRBZVHuy41t7U3+3dk5/M74/1BJY5iUFKOrxgrXoh7jTKz5VXswpGks84y2+mgie4ShEvw5aG/715GsJwxQksxU+JRAgMBAAGjggHxMIIB7TAdBgNVHQ4EFgQULykbwRyB9wkl6QYQgc882QzbGvgwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAQ8GA1UdIASCAQYwggECMIH/BgkqhkiG92NkBQEwgfEwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wKQYIKwYBBQUHAgEWHWh0dHA6Ly93d3cuYXBwbGUuY29tL2FwcGxlY2EvME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2NlcnRpZmljYXRpb25hdXRob3JpdHkvd3dkcmNhLmNybDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMwEwYKKoZIhvdjZAYBAgEB/wQCBQAwDQYJKoZIhvcNAQEFBQADggEBAHArF3TTTPWRIkbMBeXg5REFFkZmR1vL0OSqWl59eNLXdv/qgIDbHTfGoyjB6yJygLH0N2ZpbbnAtU2OtGUYDLd+ouJdqv2TORiHMC7DcvKJSVm8aPrdjJWdWy+46aI45jgPTdwKCpNuuWgjun7BwXkQL8TYLqBpb3Nu1VJYlG1esTi6VMGyfxbbpdND8fWm13Wc9Dc204mLOoinATAiXNvsS4cm2k1kNQLhSazOQ6rpxjVFRWnryKGfLHXbZ7DJjIrOvvFCHmJmhFUiunc4aH6xCrCBe2iyX5BMC4N+daIjs6ufSXdW0tbBlox1EcXMrTV6GrdSIEHlLvAfZpeFmQc="],
				ProvisionedDevices: ['']
			},
			provision];

			let testInjector = createTestInjector(provisions, [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', [provisionType]).wait(), provision, "Failed to select mobile provision with appropriate type");
		});

		it("should select correct provision when multiple provisions present and others do not include given device identifier", () => {
			let device = 'device1';
			provision.ProvisionedDevices.push(device);
			
			let provisions: IProvision[] = [{
				Name: "Invalid AdHoc Provision",
				Identifier: "R58QAA9NR8",
				ApplicationIdentifierPrefix: "R58QAA9NR8",
				ApplicationIdentifier: "com.telerik.WillSetLater.invalid",
				ProvisionType: "AdHoc",
				ExpirationDate: tomorrow,
				Certificates: ["MIIFlTCCBH2gAwIBAgIIJd9AYEgZv7cwDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTMxMTE5MTU0NTMwWhcNMTQxMTE5MTU0NTMwWjCBiDEaMBgGCgmSJomT8ixkAQEMCk1XSjJBOFg1VTcxMjAwBgNVBAMMKWlQaG9uZSBEZXZlbG9wZXI6IEljZW5pdW0gUUEgKFE3VldEOTlMN0opMRMwEQYDVQQLDApDSFNRM00zUDM3MRQwEgYDVQQKDAtUZWxlcmlrIEEgRDELMAkGA1UEBhMCQkcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCBjqn7ecjcfreSDOWWnW3peAScaQf6Fq9SPtnSPlXsJVepXy1v97+gjZW6FqJyg/Ya3861TkspOigaikU+A6+4E3gQPLQc/a2wyQetNPrn8grHS7S4LFNT5r9P8uXLTWs9K6O3NLykWc+z9YXfNevuP4nW7Udw2QHTl0h7O0OElrM4k7vQREd/PZ0WRrz6UT5xAnGpKs+hRBbtfJOqjYQAc5R0xHQiQXLg0Fb6GPpg6tQTSBuEkkkgZOWEOgeRBZVHuy41t7U3+3dk5/M74/1BJY5iUFKOrxgrXoh7jTKz5VXswpGks84y2+mgie4ShEvw5aG/715GsJwxQksxU+JRAgMBAAGjggHxMIIB7TAdBgNVHQ4EFgQULykbwRyB9wkl6QYQgc882QzbGvgwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAQ8GA1UdIASCAQYwggECMIH/BgkqhkiG92NkBQEwgfEwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wKQYIKwYBBQUHAgEWHWh0dHA6Ly93d3cuYXBwbGUuY29tL2FwcGxlY2EvME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2NlcnRpZmljYXRpb25hdXRob3JpdHkvd3dkcmNhLmNybDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMwEwYKKoZIhvdjZAYBAgEB/wQCBQAwDQYJKoZIhvcNAQEFBQADggEBAHArF3TTTPWRIkbMBeXg5REFFkZmR1vL0OSqWl59eNLXdv/qgIDbHTfGoyjB6yJygLH0N2ZpbbnAtU2OtGUYDLd+ouJdqv2TORiHMC7DcvKJSVm8aPrdjJWdWy+46aI45jgPTdwKCpNuuWgjun7BwXkQL8TYLqBpb3Nu1VJYlG1esTi6VMGyfxbbpdND8fWm13Wc9Dc204mLOoinATAiXNvsS4cm2k1kNQLhSazOQ6rpxjVFRWnryKGfLHXbZ7DJjIrOvvFCHmJmhFUiunc4aH6xCrCBe2iyX5BMC4N+daIjs6ufSXdW0tbBlox1EcXMrTV6GrdSIEHlLvAfZpeFmQc="],
				ProvisionedDevices: ['device2']
			},
			provision];

			let testInjector = createTestInjector(provisions, [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc'], device).wait(), provision, "Failed to select mobile provision with appropriate application identifier");
		});

		it("should select correct provision when multiple provisions present and others have expired", () => {
			let provisions: IProvision[] = [{
				Name: "Invalid AdHoc Provision",
				Identifier: "R58QAA9NR8",
				ApplicationIdentifierPrefix: "R58QAA9NR8",
				ApplicationIdentifier: "com.telerik.WillSetLater",
				ProvisionType: "AdHoc",
				ExpirationDate: yesterday,
				Certificates: ["MIIFlTCCBH2gAwIBAgIIJd9AYEgZv7cwDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTMxMTE5MTU0NTMwWhcNMTQxMTE5MTU0NTMwWjCBiDEaMBgGCgmSJomT8ixkAQEMCk1XSjJBOFg1VTcxMjAwBgNVBAMMKWlQaG9uZSBEZXZlbG9wZXI6IEljZW5pdW0gUUEgKFE3VldEOTlMN0opMRMwEQYDVQQLDApDSFNRM00zUDM3MRQwEgYDVQQKDAtUZWxlcmlrIEEgRDELMAkGA1UEBhMCQkcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCBjqn7ecjcfreSDOWWnW3peAScaQf6Fq9SPtnSPlXsJVepXy1v97+gjZW6FqJyg/Ya3861TkspOigaikU+A6+4E3gQPLQc/a2wyQetNPrn8grHS7S4LFNT5r9P8uXLTWs9K6O3NLykWc+z9YXfNevuP4nW7Udw2QHTl0h7O0OElrM4k7vQREd/PZ0WRrz6UT5xAnGpKs+hRBbtfJOqjYQAc5R0xHQiQXLg0Fb6GPpg6tQTSBuEkkkgZOWEOgeRBZVHuy41t7U3+3dk5/M74/1BJY5iUFKOrxgrXoh7jTKz5VXswpGks84y2+mgie4ShEvw5aG/715GsJwxQksxU+JRAgMBAAGjggHxMIIB7TAdBgNVHQ4EFgQULykbwRyB9wkl6QYQgc882QzbGvgwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAQ8GA1UdIASCAQYwggECMIH/BgkqhkiG92NkBQEwgfEwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wKQYIKwYBBQUHAgEWHWh0dHA6Ly93d3cuYXBwbGUuY29tL2FwcGxlY2EvME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2NlcnRpZmljYXRpb25hdXRob3JpdHkvd3dkcmNhLmNybDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMwEwYKKoZIhvdjZAYBAgEB/wQCBQAwDQYJKoZIhvcNAQEFBQADggEBAHArF3TTTPWRIkbMBeXg5REFFkZmR1vL0OSqWl59eNLXdv/qgIDbHTfGoyjB6yJygLH0N2ZpbbnAtU2OtGUYDLd+ouJdqv2TORiHMC7DcvKJSVm8aPrdjJWdWy+46aI45jgPTdwKCpNuuWgjun7BwXkQL8TYLqBpb3Nu1VJYlG1esTi6VMGyfxbbpdND8fWm13Wc9Dc204mLOoinATAiXNvsS4cm2k1kNQLhSazOQ6rpxjVFRWnryKGfLHXbZ7DJjIrOvvFCHmJmhFUiunc4aH6xCrCBe2iyX5BMC4N+daIjs6ufSXdW0tbBlox1EcXMrTV6GrdSIEHlLvAfZpeFmQc="],
				ProvisionedDevices: ['']
			},
			provision];

			let testInjector = createTestInjector(provisions, [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), provision, "Failed to select mobile provision with appropriate expiration date");
		});

		it("should select correct provision with fully wildcard identifier", () => {
			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), provision, "Failed to select wildcard mobile provision");
		});

		it("should select correct provision with partially wildcard identifier", () => {
			provision.ApplicationIdentifier = "com.telerik.*";

			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision('com.telerik.WillSetLater', ['AdHoc']).wait(), provision, "Failed to select wildcard mobile provision");
		});

		it("should select correct provision with exact identifier", () => {
			let identifier = "com.telerik.WillSetLater";
			provision.ApplicationIdentifier = identifier;

			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectProvision(identifier, ['AdHoc']).wait(), provision, "Failed to select wildcard mobile provision");
		});
	});

	describe("autoselectCertificate unit tests", () => {
		it("should throw if no valid certificates", () => {
			let testInjector = createTestInjector();
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.throws(() => service.autoselectCertificate(provision).wait(), 'No exception thrown when no valid certificate found');
		});

		it("should throw if no valid certificates", () => {
			let testInjector = createTestInjector();
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.throws(() => service.autoselectCertificate(provision).wait(), 'No exception thrown when no valid certificate found');
		});

		it("should select certificate when valid", () => {
			let testInjector = createTestInjector([provision], [certificate]);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectCertificate(provision).wait(), certificate, "Failed to select certificate when only one valid was present");
		});

		it("should select certificates when multiple valid are present", () => {
			provision.Certificates.push('MIIDVjCCAj6gAwIBAgIIQVwH6eri5lQwDQYJKoZIhvcNAQEFBQAwazEvMC0GA1UEAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRhMB4XDTE1MDQyNzE0NTAxN1oXDTMzMTAyMjIxMDAwMFowazEvMC0GA1UEAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtkZyEolmpmbDrJLsf7MqNqyPV9th41PO7ey5q9womLGV8JwCfLILF0NmWYmVqFFVAwGMP6sO1rDjc0Fz2afio');

			let certificates = [{
				Alias: "AdHoc Invalid Certificate",
				Attributes: [''],
				isiOS: true,
				Certificate: "-----BEGIN CERTIFICATE-----\r\nAIIDVjCCAj6gAwIBAgIIQVwH6eri5lQwDQYJKoZIhvcNAQEFBQAwazEvMC0GA1UE\r\nAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkq\r\nhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdh\r\nbmRhMB4XDTE1MDQyNzE0NTAxN1oXDTMzMTAyMjIxMDAwMFowazEvMC0GA1UEAwwm\r\nTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG\r\n9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRh\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtkZyEolmpmbDrJLsf7Mq\r\nNqyPV9th41PO7ey5q9womLGV8JwCfLILF0NmWYmVqFFVAwGMP6sO1rDjc0Fz2afi\r\no+e5SEsG9hK8ZATdQPgne8/o5Z0iZEPsQx9sKhqx3a6BG5dtKsXL5SXfAAIjt6ww\r\n0OzgOcLvdQtpn6/+yHDXwZVYPoSEMaeyfvJG592iUFl8nnxAJRQlKc/fbFnb/ImL\r\nS6rvW7kNL53vADvgGzyjRzSrMA5RUHFberXTKwy/zI9z31jCtkkwzNT3b4K/QWC2\r\n2zJOpxDKaTmS8XUET1Bu6+KJvybMniK4mwyKGUJ0acdYl8GO8n5RFYQqM3bLrzzP\r\ntQIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQBAtArx2CBKOiUSKWbSGjvF5wF0+4cX\r\nO/DmfOtcC2wOYj94Po5NyMx0viYcC1dwlFZznAp1Y3tj/Wanbz3MinzFNDSuPKRP\r\ntvNjyW1IEIQrAX+M4gnIBca/0gKiq/IerW4fpLM456mtx6fC4aX0ht7IPKE0HfmM\r\nK1m6UmocjXUm2Y0BA3RjwIl6YKV3F1yEieosh2kYwRIlb2B6llVfFCCNIeyQG7nF\r\ngepz10khSYsbp44xaHWCOuIX+Y3I9b+IF7j3b9osByBVVKg/7vhMoRws+SNzsgOF\r\nPLcyvyyC3kxu3U/SDUaCH4ZW0QKIeU8tGfd3uSvVEBM16FHbPlzWAO+9\r\n-----END CERTIFICATE-----\r\n"
			},
			certificate,
			{
				Alias: "AdHoc Certificate #2",
				Attributes: [''],
				isiOS: true,
				Certificate: "-----BEGIN CERTIFICATE-----\r\nMIIDVjCCAj6gAwIBAgIIQVwH6eri5lQwDQYJKoZIhvcNAQEFBQAwazEvMC0GA1UE\r\nAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkq\r\nhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdh\r\nbmRhMB4XDTE1MDQyNzE0NTAxN1oXDTMzMTAyMjIxMDAwMFowazEvMC0GA1UEAwwm\r\nTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG\r\n9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRh\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtkZyEolmpmbDrJLsf7Mq\r\nNqyPV9th41PO7ey5q9womLGV8JwCfLILF0NmWYmVqFFVAwGMP6sO1rDjc0Fz2afi\r\no+e5SEsG9hK8ZATdQPgne8/o5Z0iZEPsQx9sKhqx3a6BG5dtKsXL5SXfAAIjt6ww\r\n0OzgOcLvdQtpn6/+yHDXwZVYPoSEMaeyfvJG592iUFl8nnxAJRQlKc/fbFnb/ImL\r\nS6rvW7kNL53vADvgGzyjRzSrMA5RUHFberXTKwy/zI9z31jCtkkwzNT3b4K/QWC2\r\n2zJOpxDKaTmS8XUET1Bu6+KJvybMniK4mwyKGUJ0acdYl8GO8n5RFYQqM3bLrzzP\r\ntQIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQBAtArx2CBKOiUSKWbSGjvF5wF0+4cX\r\nO/DmfOtcC2wOYj94Po5NyMx0viYcC1dwlFZznAp1Y3tj/Wanbz3MinzFNDSuPKRP\r\ntvNjyW1IEIQrAX+M4gnIBca/0gKiq/IerW4fpLM456mtx6fC4aX0ht7IPKE0HfmM\r\nK1m6UmocjXUm2Y0BA3RjwIl6YKV3F1yEieosh2kYwRIlb2B6llVfFCCNIeyQG7nF\r\ngepz10khSYsbp44xaHWCOuIX+Y3I9b+IF7j3b9osByBVVKg/7vhMoRws+SNzsgOF\r\nPLcyvyyC3kxu3U/SDUaCH4ZW0QKIeU8tGfd3uSvVEBM16FHbPlzWAO+9\r\n-----END CERTIFICATE-----\r\n"
			}];
			
			let testInjector = createTestInjector([provision], certificates);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectCertificate(provision).wait(), certificate, "Failed to select valid certificate when multiple present");
		});

		it("should select first certificate when all are valid", () => {
			provision.Certificates.push('MIIDVjCCAj6gAwIBAgIIQVwH6eri5lQwDQYJKoZIhvcNAQEFBQAwazEvMC0GA1UEAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRhMB4XDTE1MDQyNzE0NTAxN1oXDTMzMTAyMjIxMDAwMFowazEvMC0GA1UEAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtkZyEolmpmbDrJLsf7MqNqyPV9th41PO7ey5q9womLGV8JwCfLILF0NmWYmVqFFVAwGMP6sO1rDjc0Fz2afio+e5SEsG9hK8ZATdQPgne8/o5Z0iZEPsQx9sKhqx3a6BG5dtKsXL5SXfAAIjt6ww0OzgOcLvdQtpn6/+yHDXwZVYPoSEMaeyfvJG592iUFl8nnxAJRQlKc/fbFnb/ImLS6rvW7kNL53vADvgGzyjRzSrMA5RUHFberXTKwy/zI9z31jCtkkwzNT3b4K/QWC22zJOpxDKaTmS8XUET1Bu6+KJvybMniK4mwyKGUJ0acdYl8GO8n5RFYQqM3bLrzzPtQIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQBAtArx2CBKOiUSKWbSGjvF5wF0+4cXO/DmfOtcC2wOYj94Po5NyMx0viYcC1dwlFZznAp1Y3tj/Wanbz3MinzFNDSuPKRPtvNjyW1IEIQrAX+M4gnIBca/0gKiq/IerW4fpLM456mtx6fC4aX0ht7IPKE0HfmMK1m6UmocjXUm2Y0BA3RjwIl6YKV3F1yEieosh2kYwRIlb2B6llVfFCCNIeyQG7nFgepz10khSYsbp44xaHWCOuIX+Y3I9b+IF7j3b9osByBVVKg/7vhMoRws+SNzsgOFPLcyvyyC3kxu3U/SDUaCH4ZW0QKIeU8tGfd3uSvVEBM16FHbPlzWAO+9');
			
			let certificates = [
			certificate,
			{
				Alias: "AdHoc Certificate #2",
				Attributes: [''],
				isiOS: true,
				Certificate: "-----BEGIN CERTIFICATE-----\r\nMIIDVjCCAj6gAwIBAgIIQVwH6eri5lQwDQYJKoZIhvcNAQEFBQAwazEvMC0GA1UE\r\nAwwmTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkq\r\nhkiG9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdh\r\nbmRhMB4XDTE1MDQyNzE0NTAxN1oXDTMzMTAyMjIxMDAwMFowazEvMC0GA1UEAwwm\r\nTW9iaWxlQ3JhZnQgRW50ZXJwcmlzZSBFZGl0aW9uIFJlbmV3ZWQxJzAlBgkqhkiG\r\n9w0BCQEWGGUyZXJlZW50ZXJwQHRlbGVyaWsxLmNvbTEPMA0GA1UEBhMGVWdhbmRh\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtkZyEolmpmbDrJLsf7Mq\r\nNqyPV9th41PO7ey5q9womLGV8JwCfLILF0NmWYmVqFFVAwGMP6sO1rDjc0Fz2afi\r\no+e5SEsG9hK8ZATdQPgne8/o5Z0iZEPsQx9sKhqx3a6BG5dtKsXL5SXfAAIjt6ww\r\n0OzgOcLvdQtpn6/+yHDXwZVYPoSEMaeyfvJG592iUFl8nnxAJRQlKc/fbFnb/ImL\r\nS6rvW7kNL53vADvgGzyjRzSrMA5RUHFberXTKwy/zI9z31jCtkkwzNT3b4K/QWC2\r\n2zJOpxDKaTmS8XUET1Bu6+KJvybMniK4mwyKGUJ0acdYl8GO8n5RFYQqM3bLrzzP\r\ntQIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQBAtArx2CBKOiUSKWbSGjvF5wF0+4cX\r\nO/DmfOtcC2wOYj94Po5NyMx0viYcC1dwlFZznAp1Y3tj/Wanbz3MinzFNDSuPKRP\r\ntvNjyW1IEIQrAX+M4gnIBca/0gKiq/IerW4fpLM456mtx6fC4aX0ht7IPKE0HfmM\r\nK1m6UmocjXUm2Y0BA3RjwIl6YKV3F1yEieosh2kYwRIlb2B6llVfFCCNIeyQG7nF\r\ngepz10khSYsbp44xaHWCOuIX+Y3I9b+IF7j3b9osByBVVKg/7vhMoRws+SNzsgOF\r\nPLcyvyyC3kxu3U/SDUaCH4ZW0QKIeU8tGfd3uSvVEBM16FHbPlzWAO+9\r\n-----END CERTIFICATE-----\r\n"
			}];
			
			let testInjector = createTestInjector([provision], certificates);
			service = testInjector.resolve(commandsModule.IdentityManager);

			assert.deepEqual(service.autoselectCertificate(provision).wait(), certificates[0], "Failed to select valid certificate when multiple present");
		});
	});
});
