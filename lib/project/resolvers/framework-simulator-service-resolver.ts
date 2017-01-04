import { FrameworkProjectResolverBase } from "./framework-project-resolver-base";

export class FrameworkSimulatorServiceResolver extends FrameworkProjectResolverBase implements Project.IFrameworkSimulatorServiceResolver {
	constructor($errors: IErrors,
		$injector: IInjector) {
		super($errors, $injector);
	}

	public resolve(framework: string): IProjectSimulatorService {
		return this.resolveByName<IProjectSimulatorService>("SimulatorService", framework);
	}
}

$injector.register("frameworkSimulatorServiceResolver", FrameworkSimulatorServiceResolver);
