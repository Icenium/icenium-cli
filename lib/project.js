(function() {
	"use strict";
	var fs = require("fs"),
		path = require("path"),
		log = require("./log"),
		util = require("util"),
		helpers = require("./helpers"),
		projectFileName = ".iceproject",
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

			if (fs.existsSync(path.join(projectDir, projectFileName))) {
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

	function zipFiles(zipFile, files) {
		var AdmZip = require("adm-zip"),
			zip = new AdmZip();

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var relativePath = getProjectRelativePath(file);

			relativePath = relativePath.replace(/\\/g, "/");
			log.trace("zipping as '%s' project file '%s'", relativePath, file);
			zip.addFile(relativePath, fs.readFileSync(file), "", 0);
		}

		zip.writeZip(zipFile);
	}

	function zipProject() {
		var tempDir = getTempDir();

		var projectZipFile = path.join(tempDir, "Build.zip");
		if (fs.existsSync(projectZipFile)) {
			fs.unlinkSync(projectZipFile);
		}

		var files = enumerateProjectFiles();
		zipFiles(projectZipFile, files);

		return projectZipFile;
	}

	function build(target) {
		var projectDir = getProjectDir();
		if (!projectDir) {
			log.fatal("Found nothing to build.");
			return;
		}

		var zippedFile = zipProject();
	}

	exports.project = projectData;
	exports.build = build;
})();
