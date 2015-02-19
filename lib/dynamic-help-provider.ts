///<reference path=".d.ts"/>

"use strict";

export class DynamicHelpProvider implements IDynamicHelpProvider {
	constructor(private $project: Project.IProject,
		private $projectConstants: Project.IProjectConstants) { }

	public isProjectType(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			if(this.$project.getProjectDir().wait()) {
				var framework = this.$project.projectData.Framework.toLowerCase();
				return _.any(args, arg => arg.toLowerCase() === framework);
			}

			return true;
		}).future<boolean>()();
	}

	public getLocalVariables(): IFuture<IDictionary<any>> {
		return ((): IDictionary<any> => {
			var localVariables:IDictionary<any> = {};
			localVariables["isMobileWebsite"] = this.isProjectType([this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite]).wait();
			localVariables["isCordova"] = this.isProjectType([this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova]).wait();
			localVariables["isNativeScript"] = this.isProjectType([this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript]).wait();
			return localVariables;
		}).future<IDictionary<any>>()();
	}
}
$injector.register("dynamicHelpProvider", DynamicHelpProvider);