(function() {
	"use strict";
	var plugman = require("plugman"),
		path = require("path"),
		fs = require("fs"),
		Q = require("q"),
		config = require("./config"),
		log = require("./log"),
		util = require("util"),
		endOfLine = require("os").EOL,
		_ = require("underscore"),
		validUrl = require("valid-url");

	function findPlugins() {
		var keywords = getKeywords(arguments);
		getPlugins(keywords)
			.then(function(plugins) {
				printPlugins(plugins);
			})
			.done();
	}

	function getPluginsNames() {
		var keywords = getKeywords(arguments);
		return getPlugins(keywords)
			.then(function(plugins) {
				return selectNames(plugins);
			});
	}

	function selectNames(plugins) {
		return _.map(plugins, function(plugin) {
			return plugin.name;
		});
	}

	function printPlugins(plugins) {
		_.each(plugins, function(plugin) {
			var pluginDescription = composePluginDescription(plugin);
			console.log(pluginDescription);
		});
	}

	function composePluginDescription(plugin) {
		var description = util.format("Name: %s%s", plugin.name, endOfLine);
		description += util.format("Description: %s%s", trim(plugin.description), endOfLine);
		description += util.format("Version: %s%s", plugin.version, endOfLine);
		return description;
	}

	function trim(content) {
		if (content) {
			return content.trim();
		}
		return undefined;
	}

	function fetchPlugin() {
		if (arguments.length === 0) {
			log.error("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the Cordova Plugin Registry.");
		} else if (arguments.length === 1 && (isLocalPath(arguments[0]) || isUrlToRepository(arguments[0]))) {
			fetch(arguments[0])
				.then(function(result) {
					console.log(result);
				})
				.done();
		} else {
			var keywords = getKeywords(arguments);
			getPlugins(keywords)
				.then(function(plugins) {
					var pluginsCount = Object.keys(plugins).length;
					if (pluginsCount === 0) {
						return "There are 0 matching plugins.";
					} else if (pluginsCount > 1) {
						return "There are more then 1 matching plugins.";
					} else {
						return fetch(Object.keys(plugins)[0]);
					}
				})
				.then(function(result) {
					console.log(result);
				})
				.done();
		}
	}

	function isLocalPath(pluginId) {
		return fs.existsSync(pluginId);
	}

	function isUrlToRepository(pluginId) {
		return validUrl.isUri(pluginId);
	}

	function getKeywords(args) {
		return _.map(args, function(item) {
			if (item) {
				return item;
			}
		});
	}

	function getPlugins(keywords) {
		return configure()
			.then(function() {
				return search(keywords);
			});
	}

	function search(keywords) {
		var deferred = Q.defer();
		plugman.search(keywords, function(result) {
			if (isError(result)) {
				deferred.reject(result);
			} else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	function fetch(pluginId) {
		var deferred = Q.defer();
		plugman.fetch(pluginId, getPluginsDir(), false, ".", "HEAD", function(result) {
			if (isError(result)) {
				deferred.reject(result);
			} else {
				var message = util.format("The plugin has been successfully fetched to %s", result);
				deferred.resolve(message);
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
		return object instanceof Error;
	}

	function getPluginsDir() {
		var project = require("./project");
		return path.join(project.getProjectDir(), "plugins");
	}

	exports.findPlugins = findPlugins;
	exports.fetchPlugin = fetchPlugin;
	exports.getPluginsNames = getPluginsNames;
}());