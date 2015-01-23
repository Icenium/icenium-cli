///<reference path="../.d.ts"/>
"use strict";

import util = require("util");

import helpers = require("./../helpers");

export class FrameworkProjectResolver implements Project.IFrameworkProjectResolver {
	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $projectConstants: Project.IProjectConstants) { }

	public resolve(framework: string): Project.IFrameworkProject {
		var fr = framework.charAt(0).toLowerCase() + framework.slice(1);
		var frameworkProject = this.$injector.resolve(util.format("%sProject", fr));
		if(!frameworkProject) {
			this.$errors.fail("Unable to resolve framework %s. Valid frameworks are: %s", framework, helpers.formatListOfNames(_.values(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS)));
		}

		return frameworkProject;
	}
}
$injector.register("frameworkProjectResolver", FrameworkProjectResolver);