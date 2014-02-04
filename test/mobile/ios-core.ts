///<reference path="./../.d.ts"/>

"use strict";

import fsLib = require("../../lib/file-system");
import yok = require("../../lib/yok");
import iOSCoreModule = require("../../lib/mobile/ios/ios-core");
import iOSProxyServicesModule = require("../../lib/mobile/ios/ios-proxy-services");
var assert = require("chai").assert;

function createTestInjector() : IInjector {
	var testInjector = new yok.Yok();

	testInjector.register("coreFoundation", iOSCoreModule.CoreFoundation);
	testInjector.register("mobileDevice", iOSCoreModule.MobileDevice);
	testInjector.register("fs", fsLib.FileSystem);

	return testInjector;
}

describe("ios", function(){
	var testInjector, coreFoundation, plistService;
	before(() => {
		testInjector = createTestInjector();
		coreFoundation = testInjector.resolve("coreFoundation");
		plistService = new iOSCoreModule.PlistService(1234);
	});

	var fromCfStringToCString = (expected: string) => {
		var cfString = coreFoundation.createCFString(expected);
		var actual = coreFoundation.convertCFStringToCString(cfString);

		assert.equal(expected, actual);
		assert.equal(expected.length, coreFoundation.stringGetLength(cfString));
	};

	describe("convertCFStringToCString", () => {
		it("creates cfstring and converts back to cstring", () => {
			fromCfStringToCString("isCorrect?/ab.project");
		});

		it("tries to convert empty cfstring", () => {
			fromCfStringToCString("");
		});
	});

	describe("plistService", () => {
		it("writes buffer to non-existing socket", () => {
			var writtenBytes = plistService.sendMessage(new Buffer("test"));
			assert.equal(writtenBytes, -1);
		});

		it("throws error when try to receive message", () => {
			assert.throws(() => { plistService.receiveMessage(); });
		});
	});
});