///<reference path="../../.d.ts"/>
"use strict";

import frameworkProjectResolverBaseLib = require("./framework-project-resolver-base");

export class FrameworkSimulatorServiceResolver extends frameworkProjectResolverBaseLib.FrameworkProjectResolverBase implements Project.IFrameworkSimulatorServiceResolver {
	constructor($errors: IErrors,
				$injector: IInjector,
				$projectConstants: Project.IConstants) {
		super($errors, $injector, $projectConstants);
	}

	public resolve(framework: string): IProjectSimulatorService {
		return this.resolveByName<IProjectSimulatorService>("SimulatorService", framework);
	}
}
$injector.register("frameworkSimulatorServiceResolver", FrameworkSimulatorServiceResolver);
