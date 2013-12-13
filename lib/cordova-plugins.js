(function() {
	"use strict";
	var plugman = require("plugman"),
		path = require("path"),
		project = require("./project"),
		Q = require("q"),
		config = require("./config"),
		log = require("./log"),
		util = require("util"),
		endOfLine = require("os").EOL;

	function findPlugins(keyword) {
		var keywords = [];
		if (keyword) {
			keywords = keyword.split(",");
		}

		configure()
		.then(function() {
			return search(keywords);
		})
		.then(function(result) {
			console.log(result);
		})
		.done();
	}

	function search(keywords) {
		var deferred = Q.defer();
		plugman.search(keywords, function(result) {
			if (isError(result)) {
				deferred.reject(result);
			}
			else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	function fetchPlugin(pluginId) {
		if (!project.hasProject()) {
			log.error(util.format("You must specify the path to the project.%s" +
				"If not specified, the project is searched for in the current directory and all directories above it.", endOfLine));
		}
		else {
			configure()
			.then(function() {
				return fetch(pluginId);
			})
			.then(function(result) {
				console.log(result);
			})
			.done();
		}
	}

	function fetch(pluginId) {
		var deferred = Q.defer();
		plugman.fetch(pluginId, getPluginsDir(), false, ".", "HEAD", function(result) {
			if (isError(result)) {
				deferred.reject(result);
			}
			else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	function configure() {
		var deferred = Q.defer();
		var params = ["set", "registry", config.CORDOVA_PLUGINS_REGISTRY];
		plugman.config(params, function(result) {
			if (isError(result)) {
				deferred.reject(result);
			}
			else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	function isError(object) {
		return typeof object instanceof Error;
	}

	function getPluginsDir() {
		return path.join(project.getProjectDir(), "plugins");
	}

	exports.findPlugins = findPlugins;
	exports.fetchPlugin = fetchPlugin;
}());