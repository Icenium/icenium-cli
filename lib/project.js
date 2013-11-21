(function() {
	"use strict";
	var fs = require("fs"),
		path = require("path"),
		log = require("./log"),
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

	function zipProject() {
		var projectDir = getProjectDir(),
			AdmZip = require("adm-zip"),
			zip = new AdmZip();
	}

	function build(target) {
		var projectDir = getProjectDir();
		if (!projectDir) {
			log.fatal("Found nothing to build.");
			return;
		}

		var tempFolder = path.join(projectDir, ".ice");
		fs.mkdirSync(tempFolder);
	}

	exports.project = projectData;
	exports.build = build;
})();
