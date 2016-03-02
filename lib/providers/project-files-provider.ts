///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";
import { ProjectFilesProviderBase } from "../common/services/project-files-provider-base";

export class ProjectFilesProvider extends ProjectFilesProviderBase {
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
		private $projectConstants: Project.IProjectConstants,
		private $injector: IInjector,
		$mobileHelper: Mobile.IMobileHelper,
		$options: ICommonOptions) {
			super($mobileHelper, $options);
		 }

	public isFileExcluded(filePath: string): boolean {
		let exclusionList = ProjectFilesProvider.INTERNAL_NONPROJECT_FILES.concat(this.getIgnoreFilesRules());
		return this.$pathFilteringService.isFileExcluded(filePath, exclusionList, this.projectDir);
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
