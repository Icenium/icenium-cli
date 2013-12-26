///<reference path=".d.ts"/>

"use strict";

import plugman = require("plugman");
import path = require("path");
import fs = require("fs");
import Q = require("q");
import config = require("./config");
import log = require("./log");
import util = require("util");
import os = require("os");
import _ = require("underscore");
import validUrl = require("valid-url");

interface IPlugin {
	name: string;
}

export function findPlugins() {
	var keywords = getKeywords(arguments);
	getPlugins(keywords)
		.then(function(plugins) {
			printPlugins(plugins);
		})
		.done();
}

export function getPluginsNames() {
	var keywords = getKeywords(arguments);
	return getPlugins(keywords)
		.then(function(plugins) {
			return selectNames(plugins);
		});
}

function selectNames(plugins: IPlugin[]) {
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
	var description = util.format("Name: %s%s", plugin.name, os.EOL);
	description += util.format("Description: %s%s", trim(plugin.description), os.EOL);
	description += util.format("Version: %s%s", plugin.version, os.EOL);
	return description;
}

function trim(content) {
	if (content) {
		return content.trim();
	}
	return undefined;
}

export function fetchPlugin() {
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
			.then(function(plugins): any {
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

function isUrlToRepository(pluginId: string): boolean {
	return validUrl.isUri(pluginId);
}

function getKeywords(args): string[] {
	return Array.prototype.filter(args, function(item) {
		return item;
	});
}

function getPlugins(keywords: string[]): Q.Promise<IPlugin[]> {
	return configure()
		.then(function() {
			return search(keywords);
		});
}

function search(keywords: string[]): Q.Promise<IPlugin[]> {
	var deferred = Q.defer<IPlugin[]>();
	plugman.search(keywords, function(result) {
		if (isError(result)) {
			deferred.reject(result);
		} else {
			deferred.resolve(result);
		}
	});
	return deferred.promise;
}

function fetch(pluginId: string): Q.Promise<string> {
	var deferred = Q.defer<string>();
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

function configure():Q.Promise<void> {
	var deferred = Q.defer<void>();
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

function isError(object:any): boolean {
	return object instanceof Error;
}

function getPluginsDir() {
	var project = require("./project");
	return path.join(project.getProjectDir(), "plugins");
}
