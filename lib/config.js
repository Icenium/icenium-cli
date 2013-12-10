"use strict";

(function() {
	var qfs = require("q-io/fs"),
		path = require("path");

	function log() {
		return require("./log");
	}

	function getConfigName(filename) {
		return path.join(__dirname, "../config/", filename + ".json");
	}

	function copyFile(from, to) {
		return qfs.read(from, "b")
			.then(function (content) {
				return qfs.write(to, content, "wb");
			});
	}

	function loadConfig(name) {
		var configFileName = getConfigName(name);
		return JSON.parse(require("fs").readFileSync(configFileName));
	}
	
	function saveConfig(config, name) {
		var configNoFunctions = {};
		Object.keys(config).forEach(function(key) {
			var entry = config[key];
			if (typeof entry !== "function") {
				configNoFunctions[key] = entry;
			}
		});


		var configFileName = getConfigName(name);
		log().trace("Saving config to '%s', contents: %s", configFileName, configNoFunctions);
		return qfs.write(configFileName, JSON.stringify(configNoFunctions, null, "\t"));
	}

	function mergeConfig(config, mergeFrom) {
		Object.keys(mergeFrom).forEach(function(key) {
			config[key] = mergeFrom[key];
		});
	}

	mergeConfig(exports, loadConfig("config"));

	exports.reset = function reset() {
		return copyFile(getConfigName("config-base"), getConfigName("config"))
			.done();
	};

	exports.apply = function apply(configName) {
		var baseConfig = loadConfig("config-base");
		var newConfig = loadConfig("config-" + configName);
		log().trace("Base config is: %s", baseConfig);
		log().trace("Applied config is: %s", newConfig);

		mergeConfig(baseConfig, newConfig);
		log().trace("Combined config is: %s", baseConfig);

		saveConfig(baseConfig, "config").done();
	};
})();
