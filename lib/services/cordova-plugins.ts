///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import path = require("path");
import Q = require("q");
import config = require("../config");
import util = require("util");
import os = require("os");
import _ = require("underscore");
import validUrl = require("valid-url");
import fs = require("fs");

export interface IPlugin {
	name: string;
}

export class CordovaPluginsService {
	public getPlugins(keywords: string[]): Q.Promise<IPlugin[]> {
		return <Q.Promise<IPlugin[]>>this.configure()
			.then(() => {
				return this.search(keywords);
			});
	}

	public search(keywords: string[]): Q.Promise<IPlugin[]> {
		var deferred = Q.defer<IPlugin[]>();
		plugman.search(keywords, (result) => {
			if (this.isError(result)) {
				deferred.reject(result);
			} else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	public fetch(pluginId: string): Q.Promise<string> {
		var deferred = Q.defer<string>();
		plugman.fetch(pluginId, this.getPluginsDir(), false, ".", "HEAD", (result) => {
			if (this.isError(result)) {
				deferred.reject(result);
			} else {
				var message = util.format("The plugin has been successfully fetched to %s", result);
				deferred.resolve(message);
			}
		});
		return deferred.promise;
	}

	public configure(): Q.Promise<void> {
		var deferred = Q.defer<void>();
		var params = ["set", "registry", config.CORDOVA_PLUGINS_REGISTRY];
		plugman.config(params, (result) => {
			if (this.isError(result)) {
				deferred.reject(result);
			}
			else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	private isError(object:any): boolean {
		return object instanceof Error;
	}

	private getPluginsDir() {
		var project = require("../project");
		return path.join(project.getProjectDir(), "plugins");
	}
}
global.$injector.register("cordovaPluginsService", CordovaPluginsService);