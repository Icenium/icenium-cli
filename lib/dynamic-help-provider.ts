import { TARGET_FRAMEWORK_IDENTIFIERS } from "./common/constants";

export class DynamicHelpProvider implements IDynamicHelpProvider {
	constructor(private $project: Project.IProject,
		private $projectConstants: Project.IConstants) { }

	public isProjectType(args: string[]): boolean {
		if(this.$project.getProjectDir()) {
			let framework = this.$project.projectData.Framework.toLowerCase();
			return _.some(args, arg => arg.toLowerCase() === framework);
		}

		return true;
	}

	public getLocalVariables(options: { isHtml: boolean }): IDictionary<any> {
		let isHtml = options.isHtml;
		let localVariables:IDictionary<any> = {};
		localVariables["isCordova"] = isHtml || this.isProjectType([TARGET_FRAMEWORK_IDENTIFIERS.Cordova]);
		localVariables["isNativeScript"] = isHtml || this.isProjectType([TARGET_FRAMEWORK_IDENTIFIERS.NativeScript]);

		return localVariables;
	}
}
$injector.register("dynamicHelpProvider", DynamicHelpProvider);
