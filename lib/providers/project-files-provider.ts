///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";

export class ProjectFilesProvider implements IProjectFilesProvider {
	private static IGNORE_FILE = ".abignore";
	private static INTERNAL_NONPROJECT_FILES = [".ab", ProjectFilesProvider.IGNORE_FILE, ".*" + ProjectFilesProvider.IGNORE_FILE, "**/*.ipa", "**/*.apk", "**/*.xap"];
	private _projectDir: string = null;
	private get projectDir(): string {
		if (!this._projectDir) {
			let project: Project.IProject = this.$injector.resolve("project");
			this._projectDir = project.getProjectDir().wait();
		}

		return this._projectDir;
	}

	constructor(private $pathFilteringService: IPathFilteringService,
		private $options: IOptions,
		private $projectConstants: Project.IProjectConstants,
		private $injector: IInjector) { }

	public get excludedProjectDirsAndFiles(): string[] {
		return ProjectFilesProvider.INTERNAL_NONPROJECT_FILES;
	}

	public isFileExcluded(filePath: string): boolean {
		let x = this.$pathFilteringService.isFileExcluded(filePath, this.getIgnoreFilesRules(), this.projectDir);
		return x;
	}

	public mapFilePath(filePath: string, platform: string): string {
		return filePath;
	}

	private ignoreFilesRules: string[] = null;
	private getIgnoreFilesRules(): string[] {
		if (!this.ignoreFilesRules) {
			this.ignoreFilesRules = <string[]>_(this.ignoreFilesConfigurations)
				.map(configFile => this.$pathFilteringService.getRulesFromFile(path.join(this.projectDir, configFile)))
				.flatten()
				.value();
		}
		return this.ignoreFilesRules;
	}

	private get ignoreFilesConfigurations(): string[] {
		let configurations: string[] = [ ProjectFilesProvider.IGNORE_FILE ];
		// unless release is explicitly set, we use debug config
		let configFileName = "." +
			(this.$options.release ? this.$projectConstants.RELEASE_CONFIGURATION_NAME : this.$projectConstants.DEBUG_CONFIGURATION_NAME) +
			ProjectFilesProvider.IGNORE_FILE;
		configurations.push(configFileName);
		return configurations;
	}
}
$injector.register("projectFilesProvider", ProjectFilesProvider);
