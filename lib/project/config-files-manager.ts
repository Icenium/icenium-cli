///<reference path="../.d.ts"/>
"use strict";

export class ConfigurationFile implements Project.IConfigurationFile {
	constructor(public template: string,
		public filepath: string,
		public templateFilepath: string,
		public helpText: string) { }
}

export class ConfigFilesManager implements Project.IConfigFilesManager {
	public get availableConfigFiles(): IDictionary<Project.IConfigurationFile> {
		return {
			"cordova-android-manifest": new ConfigurationFile(
				"android-manifest",
				"App_Resources/Android/AndroidManifest.xml",
				"Mobile.Cordova.Android.ManifestXml.zip",
				"Opens AndroidManifest.xml for editing and creates it, if needed."
			),
			"nativescript-android-manifest": new ConfigurationFile(
				"android-manifest",
				"app/App_Resources/Android/AndroidManifest.xml",
				"Mobile.NativeScript.Android.ManifestXml.zip",
				"Opens AndroidManifest.xml for editing and creates it, if needed."
			),
			"android-config": new ConfigurationFile(
				"android-config",
				"App_Resources/Android/xml/config.xml",
				"Mobile.Cordova.Android.ConfigXml.zip",
				"Opens config.xml for Android for editing and creates it, if needed."
			),
			"ios-info": new ConfigurationFile(
				"ios-info",
				"App_Resources/iOS/Info.plist",
				"Mobile.iOS.InfoPlist.zip",
				"Opens Info.plist for editing and creates it, if needed."
			),
			"nativescript-ios-info": new ConfigurationFile(
				"ios-info",
				"app/App_Resources/iOS/Info.plist",
				"Mobile.iOS.InfoPlist.zip",
				"Opens Info.plist for editing and creates it, if needed."
			),
			"ios-config": new ConfigurationFile(
				"ios-config",
				"App_Resources/iOS/config.xml",
				"Mobile.Cordova.iOS.ConfigXml.zip",
				"Opens config.xml for iOS for editing and creates it, if needed."
			),
			"wp8-manifest": new ConfigurationFile(
				"wp8-manifest",
				"App_Resources/WP8/WMAppManifest.xml",
				"Mobile.WP8.WMAppManifestXml.zip",
				"Opens WMAppManifest.xml for editing and creates it, if needed."
			),
			"wp8-config": new ConfigurationFile(
				"wp8-config",
				"App_Resources/WP8/config.xml",
				"Mobile.Cordova.WP8.ConfigXml.zip",
				"Opens config.xml for Windows Phone 8 for editing and creates it, if needed."
			)
		};
	}
}
$injector.register("configFilesManager", ConfigFilesManager);

