(function() {
	"use strict";
	var fs = require("fs"),
		path = require("path"),
		config = require("./config"),
		options = require("./options"),
		log = require("./log"),
		util = require("util"),
		helpers = require("./helpers"),
		server = require("./server"),
		cachedProjectDir = "",
		projectData;

	function getProjectDir() {
		if (cachedProjectDir !== "") {
			return cachedProjectDir;
		}
		cachedProjectDir = null;

		var projectDir = path.resolve(".");
		while (true) {
			log.trace("Looking for project in '%s'", projectDir);

			if (fs.existsSync(path.join(projectDir, config.PROJECT_FILE_NAME))) {
				log.debug("Project directory is '%s'.", projectDir);
				cachedProjectDir = projectDir;
				break;
			}

			var dir = path.dirname(projectDir);
			if (dir === projectDir) {
				log.fatal("No project found at or above '%s'.", path.resolve('.'));
				break;
			}
			projectDir = dir;
		}

		return cachedProjectDir;
	}

	function getTempDir() {
		var dir = path.join(getProjectDir(), ".ice");
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		return dir;
	}

	function getProjectRelativePath(fullPath) {
		var projectDir = getProjectDir() + path.sep;
		if (!fullPath.startsWith(projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	function enumerateProjectFiles() {
		var projectDir = getProjectDir();
		var projectFiles = helpers.enumerateFilesInDirectorySync(projectDir, function(filePath, stat) {
			if (path.basename(filePath) == ".ice") {
				return false;
			}

			return true;
		});

		log.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));
		return projectFiles;
	}

	function zipProject(callback) {
		helpers.ensureCallback(callback, 0);

		var tempDir = getTempDir();

		var projectZipFile = path.join(tempDir, "Build.zip");
		if (fs.existsSync(projectZipFile)) {
			fs.unlinkSync(projectZipFile);
		}

		var files = enumerateProjectFiles();
		helpers.zipFiles(projectZipFile, files,
			function(path) {
				return getProjectRelativePath(path);
			},
			function(err) {
				callback(err, {output: projectZipFile});
			});
	}

	function requestCloudBuild(platform, configuration) {

		var buildProperties = {
			Configuration: configuration,
			Platform: platform,

			CorePlugins: projectData.CorePlugins,
			AndroidPermissions: projectData.AndroidPermissions,
			AppIdentifier: projectData.AppIdentifier,
			ProjectName: projectData.name,
			ProjectGuid: projectData.ProjectGuid,
			FrameworkVersion: projectData.FrameworkVersion,
			DeviceOrientations: projectData.DeviceOrientations,

			AndroidVersionCode: projectData.AndroidVersionCode,
			AndroidHardwareAcceleration: projectData.AndroidHardwareAcceleration,

			BundleVersion: projectData.BundleVersion,
			iOSDisplayName: projectData.iOSDisplayName,
			iOSDeviceFamily: projectData.iOSDeviceFamily,
			iOSStatusBarStyle: projectData.iOSStatusBarStyle,
			//TODO: iOSBackgroundMode ?

			"MobileProvisionIdentifier":"",
			"iOSCodesigningIdentity":"",
			"AndroidCodesigningIdentity":""
		};

		Object.keys(buildProperties).forEach(function(prop) {
			if (buildProperties[prop] === undefined) {
				throw new Error(util.format("Build property '%s' is undefined.", prop));
			}
		})

		server.buildProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, buildProperties, function(err, result) {
			if (err) {
				throw err;
			}
			
			var build = result.buildResults;
			for (var i = 0; i < build.length; i++) {
				log.debug(build[i]);
				if (options.download) {
					var filesystemPath = build[i].filesystemPath;
					var targetFileName = path.join(getTempDir(), path.basename(filesystemPath));
					server.downloadFile(filesystemPath, targetFileName, function(err, result) {
						if (err) {
							throw err;
						}
						log.info("Download completed: %s", targetFileName);
					});
				}
			};

			if (result.output) {
				var buildLogFilePath = path.join(getTempDir(), "build.log");
				fs.writeFile(buildLogFilePath, result.output, function (err) {
					if (err) {
						throw err;
					}
					log.debug("Build log written to %s", buildLogFilePath);
				})
			}
		})
	}

	function build(platform, configuration) {
		configuration = configuration || "Debug";
		log.info("Building project for platform '%s', configuration '%s'", platform, configuration);

		var projectDir = getProjectDir();
		if (!projectDir) {
			log.fatal("Found nothing to build.");
			return;
		}

		zipProject(function(err, result) {
			if (err) {
				throw err;
			}
			log.debug("zipping completed, result file size: %d", fs.statSync(result.output).size);

			server.importProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, result.output,
				function(err, importResponse) {
					if (err !== null) {
						throw err;
					}

					log.trace("Project imported");

					requestCloudBuild(platform, configuration);
				});
		});
	}

	projectData = JSON.parse(fs.readFileSync(path.join(getProjectDir(), config.PROJECT_FILE_NAME)));

	exports.project = projectData;
	exports.build = build;
})();
