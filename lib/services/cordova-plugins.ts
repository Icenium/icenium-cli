///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import path = require("path");
import config = require("../config");
import util = require("util");
import os = require("os");
import _ = require("underscore");
import validUrl = require("valid-url");
import fs = require("fs");
import Fiber = require("fibers");

export interface IPlugin {
	name: string;
}

export class CordovaPluginsService {
	public getPlugins(keywords: string[]): IPlugin[] {
		this.configure();
		return this.search(keywords);
	}

	public search(keywords: string[]): IPlugin[] {
		var fiber = Fiber.current;
		plugman.search(keywords, (result) => {
			if (this.isError(result)) {
				fiber.throwInto(result);
			} else {
				fiber.run(result);
			}
		});
		return Fiber.yield();
	}

	public fetch(pluginId: string): string {
		var fiber = Fiber.current;
		plugman.fetch(pluginId, this.getPluginsDir(), false, ".", "HEAD", (result) => {
			if (this.isError(result)) {
				fiber.throwInto(result);
			} else {
				var message = util.format("The plugin has been successfully fetched to %s", result);
				fiber.run(message);
			}
		});
		return Fiber.yield();
	}

	public configure(): void {
		var fiber = Fiber.current;
		var params = ["set", "registry", config.CORDOVA_PLUGINS_REGISTRY];
		plugman.config(params, (result) => {
			if (this.isError(result)) {
				fiber.throwInto(result);
			} else {
				fiber.run(result);
			}
		});
		Fiber.yield();
	}

	private isError(object:any): boolean {
		return object instanceof Error;
	}

	private getPluginsDir() {
		var project = require("../project");
		return path.join(project.getProjectDir(), "plugins");
	}
}
$injector.register("cordovaPluginsService", CordovaPluginsService);