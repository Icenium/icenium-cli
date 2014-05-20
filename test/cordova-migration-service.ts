///<reference path=".d.ts"/>

import Future = require("fibers/future");
import chai = require("chai");
import fs = require("fs");
import path = require("path");
import stubs = require("./stubs");
import yok = require("../lib/yok");
import cordovaMigrationService = require("../lib/services/cordova-migration-service");
var assert: chai.Assert = chai.assert;

var testInjector = new yok.Yok();
testInjector.register("server", {});

function registerMockedFS(mockResult: any): void {
    testInjector.register("fs", {
        readJson: () => { return Future.fromResult(mockResult); },
    });
}

describe("cordova-migration-service", () => {
    describe("migratePlugins", () => {
        it("Return unchanged plugins if no rename matches", () => {
            registerMockedFS({
                renamedPlugins:
                [{
                    version: "3.2.0",
                    oldName: "org.apache.cordova.AudioHandler",
                    newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.2.0": ["org.apache.cordova.media", "plugin"]
				}
            });

            var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
            assert.deepEqual(service.migratePlugins(["plugin"], "3.0.0", "3.2.0").wait(), ["plugin"]);
        });

        it("Return unchanged plugins if a rename matches but it's for a later version", () => {
            registerMockedFS({
                renamedPlugins:
                [{
                    version: "3.4.0",
                    oldName: "org.apache.cordova.AudioHandler",
                    newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.2.0": ["org.apache.cordova.AudioHandler"],
					"3.4.0": ["org.apache.cordova.media"]
				}
            });

            var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			assert.deepEqual(service.migratePlugins(["org.apache.cordova.AudioHandler"], "3.0.0", "3.2.0").wait(), ["org.apache.cordova.AudioHandler"]);
		});

		it("Remove plugins if they are no longer available in the version we are migrating to", () => {
			registerMockedFS({
				renamedPlugins: [],
				integratedPlugins: {
					"3.0.0": ["org.apache.cordova.camera"],
					"3.2.0": ["org.apache.cordova.camera", "org.apache.cordova.statusbar"]
				}
			});

			var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			assert.deepEqual(service.migratePlugins(["org.apache.cordova.camera", "org.apache.cordova.statusbar"], "3.2.0", "3.0.0").wait(), ["org.apache.cordova.camera"]);
		});

        it("Return renamed plugin if a rename matches", () => {
            registerMockedFS({
                renamedPlugins: [{
                    version: "3.2.0",
                    oldName: "org.apache.cordova.AudioHandler",
                    newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.2.0": ["org.apache.cordova.media"]
				}
            });

            var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			assert.deepEqual(service.migratePlugins(["org.apache.cordova.AudioHandler"], "3.0.0", "3.2.0").wait(), ["org.apache.cordova.media"]);
        });

        it("Return renamed plugin if a rename matches and it is a downgrade", () => {
            registerMockedFS({
                renamedPlugins: [{
                    version: "3.2.0",
                    oldName: "org.apache.cordova.AudioHandler",
                    newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.0.0": ["org.apache.cordova.AudioHandler"],
				}
            });

            var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			assert.deepEqual(service.migratePlugins(["org.apache.cordova.media"], "3.2.0", "3.0.0").wait(), ["org.apache.cordova.AudioHandler"]);
        });

        it("Return renamed plugin if there is a rename chain", () => {
            registerMockedFS({
                renamedPlugins: [{
                    version: "3.2.0",
                    oldName: "org.apache.cordova.AudioHandler",
                    newName: "org.apache.cordova.media"
                },
                {
                    version: "3.4.0",
                    oldName: "org.apache.cordova.media",
                    newName: "org.apache.cordova.NewMedia"
					}],
				integratedPlugins: {
					"3.4.0": ["org.apache.cordova.NewMedia"]
				}
            });

            var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			assert.deepEqual(service.migratePlugins(["org.apache.cordova.AudioHandler"], "3.0.0", "3.4.0").wait(), ["org.apache.cordova.NewMedia"]);
        });

        it("Return renamed plugin if there is a rename chain when downgrading", () => {
            registerMockedFS({
                renamedPlugins: [{
                    version: "3.2.0",
                    oldName: "org.apache.cordova.AudioHandler",
                    newName: "org.apache.cordova.media"
                },
                {
                    version: "3.4.0",
                    oldName: "org.apache.cordova.media",
                    newName: "org.apache.cordova.NewMedia"
					}],
				integratedPlugins: {
					"3.0.0": ["org.apache.cordova.AudioHandler"]
				}
            });

            var service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			assert.deepEqual(service.migratePlugins(["org.apache.cordova.NewMedia"], "3.4.0", "3.0.0").wait(), ["org.apache.cordova.AudioHandler"]);
        });
    });
});
