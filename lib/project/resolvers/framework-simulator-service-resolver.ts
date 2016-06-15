import frameworkProjectResolverBaseLib = require("./framework-project-resolver-base");

export class FrameworkSimulatorServiceResolver extends frameworkProjectResolverBaseLib.FrameworkProjectResolverBase implements Project.IFrameworkSimulatorServiceResolver {
	constructor($errors: IErrors,
				$injector: IInjector) {
		super($errors, $injector);
	}

	public resolve(framework: string): IProjectSimulatorService {
		return this.resolveByName<IProjectSimulatorService>("SimulatorService", framework);
	}
}
$injector.register("frameworkSimulatorServiceResolver", FrameworkSimulatorServiceResolver);
