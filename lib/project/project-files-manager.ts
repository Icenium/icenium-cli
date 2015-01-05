///<reference path="../.d.ts"/>
"use strict";

import minimatch = require("minimatch");
import path = require("path");
import util = require("util");

import commonHelpers = require("./../common/helpers");
import options = require("./../options");

export class ConfigurationFile implements Project.IConfigurationFile {
	constructor(public template: string,
		public filepath: string,
		public templateFilepath: string,
		public helpText: string) { }
}

export class ProjectFilesManager implements Project.IProjectFilesManager {

	private static IGNORE_FILE = ".abignore";
	private static INTERNAL_NONPROJECT_FILES = [".ab", ProjectFilesManager.IGNORE_FILE, ".*" + ProjectFilesManager.IGNORE_FILE, "**/*.ipa", "**/*.apk", "**/*.xap"];

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $pathFilteringService: IPathFilteringService,
		private $projectConstants: Project.IProjectConstants) { }

	public get availableConfigFiles(): IDictionary<Project.IConfigurationFile> {
		return {
			"android-manifest": new ConfigurationFile(
				"android-manifest",
				"App_Resources/Android/AndroidManifest.xml",
				"Mobile.Android.ManifestXml.zip",
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

	public enumerateProjectFiles(projectDir: string, additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]> {
		return (() => {
			var excludedProjectDirsAndFiles = ProjectFilesManager.INTERNAL_NONPROJECT_FILES.
				concat(additionalExcludedProjectDirsAndFiles || []);

			var projectFiles = commonHelpers.enumerateFilesInDirectorySync(projectDir, (filePath, stat) => {
				var isExcluded = this.isFileExcluded(path.relative(projectDir, filePath), excludedProjectDirsAndFiles);
				var isSubprojectDir = stat.isDirectory() && this.$fs.exists(path.join(filePath, this.$projectConstants.PROJECT_FILE)).wait();
				return !isExcluded && !isSubprojectDir;
			});

			var ignoreFilesRules = <string[]>_(this.ignoreFilesConfigurations)
				.map(configFile => this.$pathFilteringService.getRulesFromFile(path.join(projectDir, configFile)))
				.flatten()
				.value();

			projectFiles = this.$pathFilteringService.filterIgnoredFiles(projectFiles, ignoreFilesRules, projectDir);

			this.$logger.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));
			return projectFiles;
		}).future<string[]>()();
	}

	public isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean {
		var excludedProjectDirsAndFiles = ProjectFilesManager.INTERNAL_NONPROJECT_FILES.
			concat(additionalExcludedDirsAndFiles || []);

		var relativeToProjectPath = path.relative(projectDir, filePath);
		return this.isFileExcluded(relativeToProjectPath, excludedProjectDirsAndFiles);
	}


	private get ignoreFilesConfigurations(): string[] {
		var configurations: string[] = [ ProjectFilesManager.IGNORE_FILE ];
		// unless release is explicitly set, we use debug config
		var configFileName = "." +
			((options.release || options.r) ? this.$projectConstants.RELEASE_CONFIGURATION_NAME : this.$projectConstants.DEBUG_CONFIGURATION_NAME) +
			ProjectFilesManager.IGNORE_FILE;
		configurations.push(configFileName);
		return configurations;
	}

	private isFileExcluded(path: string, exclusionList: string[]): boolean {
		return Boolean(_.find(exclusionList, (pattern) => minimatch(path, pattern, { nocase: true })));
	}
}
$injector.register("projectFilesManager", ProjectFilesManager);