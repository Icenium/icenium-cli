///<reference path=".d.ts"/>

"use strict";

import path = require("path");

export var TFIS_SERVER;
export var ICE_SERVER_PROTO;
export var ICE_SERVER;
export var DEBUG;
export var PROXY_TO_FIDDLER;
export var PROJECT_FILE_NAME;
export var SOLUTION_SPACE_NAME;
export var QR_SIZE;
export var DEFAULT_PROJECT_TEMPLATE;
export var TEMPLATE_NAMES;
export var CORDOVA_PLUGINS_REGISTRY;
export var DEFAULT_PROJECT_NAME;
export var CI_LOGGER;

var qfs = require("q-io/fs"),
	log = null /*don't log in config.js due to cyclic dependency*/;

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
	return qfs.write(configFileName, JSON.stringify(configNoFunctions, null, "\t"));
}

function mergeConfig(config, mergeFrom) {
	Object.keys(mergeFrom).forEach(function(key) {
		config[key] = mergeFrom[key];
	});
}

mergeConfig(exports, loadConfig("config"));

export function reset() {
	return copyFile(getConfigName("config-base"), getConfigName("config"))
		.done();
};

export function apply(configName) {
	var baseConfig = loadConfig("config-base");
	var newConfig = loadConfig("config-" + configName);
	mergeConfig(baseConfig, newConfig);
	saveConfig(baseConfig, "config").done();
};

$injector.register("config", exports);
