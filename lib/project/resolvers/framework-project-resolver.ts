///<reference path="../../.d.ts"/>
"use strict";

import frameworkProjectResolverBaseLib = require("./framework-project-resolver-base");

export class FrameworkProjectResolver extends frameworkProjectResolverBaseLib.FrameworkProjectResolverBase implements Project.IFrameworkProjectResolver {
	constructor($errors: IErrors,
		$injector: IInjector,
		$projectConstants: Project.IProjectConstants) {
		super($errors, $injector, $projectConstants);
	}

	public resolve(framework: string, projectInformation?: Project.IProjectInformation): Project.IFrameworkProject {
		return this.resolveByName<Project.IFrameworkProject>("Project", framework, { projectInformation: projectInformation || {} });
	}
}
$injector.register("frameworkProjectResolver", FrameworkProjectResolver);