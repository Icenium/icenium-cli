///<reference path="../.d.ts"/>
"use strict";

export class ProjectConstants implements Project.IProjectConstants {
	public PROJECT_FILE = ".abproject";
	public DEBUG_CONFIGURATION_NAME = "debug";
	public DEBUG_PROJECT_FILE_NAME = ".debug.abproject";
	public RELEASE_CONFIGURATION_NAME = "release";
	public RELEASE_PROJECT_FILE_NAME = ".release.abproject";
	public TARGET_FRAMEWORK_IDENTIFIERS = {
		Cordova: "Cordova",
		NativeScript: "NativeScript",
		MobileWebsite: "MobileWebsite"
	};
}
$injector.register("projectConstants", ProjectConstants);
