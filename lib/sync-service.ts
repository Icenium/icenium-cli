///<reference path=".d.ts"/>

(function() {
	"use strict";
	var log = require("./log"),
		options = require("./options"),
		project = require("./project"),
		devicesService = require("./devices-service"),
		watchr = require("watchr"),
		path = require("path"),
		fs = require("fs"),
		util = require("util");

	var excludedProjectDirsAndFiles = [".ab", "app_resources", ".abproject", "plugins"];

	function sync(platform) {
		var projectDir = project.getProjectDir();
		var appIdentifier = project.project.AppIdentifier;

		if (options.live) {
			liveSyncDevices(platform, projectDir, appIdentifier);
		} else {
			var successMessage = "The sync has been successfull";
			if (options.file) {
				fs.exists(options.file, function (exists) {
					if (exists) {
						var projectFiles = [path.resolve(options.file)];
						syncDevices(platform, projectDir, projectFiles, appIdentifier, successMessage);
					} else {
						console.log(util.format("The file %s does not exist.", options.file));
					}
				});
			} else {
				var projectFiles = project.enumerateProjectFiles(excludedProjectDirsAndFiles);
				syncDevices(platform, projectDir, projectFiles, appIdentifier, successMessage);
			}
		}
	}

	function liveSyncDevices(platform, projectDir, appIdentifier) {
		watchr.watch({
			paths: [projectDir],
			listeners: {
				error: function(error) {
					log.trace(error);
				},
				change: function(changeType, filePath) {
					if (!project.isProjectFileExcluded(projectDir, filePath, excludedProjectDirsAndFiles)) {
						log.trace(util.format("Syncing %s", filePath));

						var successMessage = util.format("%s has been successfully synced.", filePath);
						syncDevices(platform, projectDir, [filePath], appIdentifier, successMessage);
					}
				},
				next: function(error, watchers) {
					log.trace("File system whatchers are stopping.");
					for (var i = 0; i < watchers.length; i++) {
						watchers[i].close();
					}
					log.trace("File system whatchers are stopped.");
				}
			}
		});
	}

	function syncDevices(platform, projectDir, projectFiles, appIdentifier, successMessage) {
		var syncPromise = devicesService.sync(platform, projectDir, projectFiles, appIdentifier);
		if (syncPromise) {
			syncPromise
			.then(function () {
				console.log(successMessage);
			})
			.done();
		}
	}

	exports.sync = sync;
})();