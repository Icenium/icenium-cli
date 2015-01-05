///<reference path="../.d.ts"/>
"use strict";

export class ProjectConstants implements Project.IProjectConstants {
	public PROJECT_FILE = ".abproject";
	public DEBUG_CONFIGURATION_NAME = "debug";
	public RELEASE_CONFIGURATION_NAME = "release";
	public TARGET_FRAMEWORK_IDENTIFIERS = {
		Cordova: "Cordova",
		NativeScript: "NativeScript",
		MobileWebSite: "MobileWebSite"
	};
}
$injector.register("projectConstants", ProjectConstants);
