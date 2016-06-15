import { TARGET_FRAMEWORK_IDENTIFIERS } from "./common/mobile/constants";

export class DynamicHelpProvider implements IDynamicHelpProvider {
	constructor(private $project: Project.IProject,
		private $projectConstants: Project.IConstants) { }

	public isProjectType(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			if(this.$project.getProjectDir().wait()) {
				let framework = this.$project.projectData.Framework.toLowerCase();
				return _.any(args, arg => arg.toLowerCase() === framework);
			}

			return true;
		}).future<boolean>()();
	}

	public getLocalVariables(options: { isHtml: boolean }): IFuture<IDictionary<any>> {
		return ((): IDictionary<any> => {
			let isHtml = options.isHtml;
			let localVariables:IDictionary<any> = {};
			localVariables["isCordova"] = isHtml || this.isProjectType([TARGET_FRAMEWORK_IDENTIFIERS.Cordova]).wait();
			localVariables["isNativeScript"] = isHtml || this.isProjectType([TARGET_FRAMEWORK_IDENTIFIERS.NativeScript]).wait();

			return localVariables;
		}).future<IDictionary<any>>()();
	}
}
$injector.register("dynamicHelpProvider", DynamicHelpProvider);
