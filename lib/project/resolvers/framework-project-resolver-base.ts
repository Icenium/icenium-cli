///<reference path="../../.d.ts"/>
"use strict";

import util = require("util");
import helpers = require("./../../helpers");

export class FrameworkProjectResolverBase implements Project.IFrameworkProjectResolverBase {
	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $projectConstants: Project.IProjectConstants) { }

	public resolveByName<T>(name: string, framework: string, ctorArguments?: IDictionary<any>): T {
		var fr = framework.charAt(0).toLowerCase() + framework.slice(1);
		var frameworkName = util.format("%s%s", fr, name);
		try {
			var frameworkObject = this.$injector.resolve(frameworkName, ctorArguments);
		} catch(err) {
			this.$errors.fail("Unable to resolve framework %s. Valid frameworks are: %s", frameworkName, helpers.formatListOfNames(_.values(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS)));
		}

		return frameworkObject;
	}
}