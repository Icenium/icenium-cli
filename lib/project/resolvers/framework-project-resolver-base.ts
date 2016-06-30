import * as helpers from "../../helpers";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";

export class FrameworkProjectResolverBase implements Project.IFrameworkProjectResolverBase {
	constructor(private $errors: IErrors,
		private $injector: IInjector) { }

	public resolveByName<T>(name: string, framework: string, ctorArguments?: IDictionary<any>): T {
		let fr = framework.charAt(0).toLowerCase() + framework.slice(1);
		let frameworkName = fr + name;
		try {
			let frameworkObject = this.$injector.resolve(frameworkName, ctorArguments);
			return frameworkObject;
		} catch (err) {
			this.$errors.fail("Unable to resolve framework %s. Valid frameworks are: %s", frameworkName, helpers.formatListOfNames(_.values<string>(TARGET_FRAMEWORK_IDENTIFIERS)));
		}
	}
}
