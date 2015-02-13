///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import os = require("os");
import temp = require("temp");
import commonHelpers = require("../common/helpers");
import helpers = require("../helpers");
var options: any = require("../common/options");

class Sample {
	constructor(public name: string,
		public displayName: string,
		public description: string,
		public zipUrl: string,
		public githubUrl: string,
		public type: string) {
	}
}

export class SamplesService implements ISamplesService {
	private static GITHUB_ICENIUM_LOCATION_ENDPOINT = "https://api.github.com/orgs/Icenium/repos?per_page=100";
	private static GITHUB_TELERIK_LOCATION_ENDPOINT = "https://api.github.com/orgs/telerik/repos?per_page=100";
	private static GITHUB_REGEX = /https:\/\/github[.]com\/Icenium\/sample-[\w\W]+[.]git$/i;
	private static NAME_FORMAT_REGEX = /(sample-|-)/gi;
	private static NAME_PREFIX_REMOVAL_REGEX = /(sample-)/i
	private static REMOTE_LOCK_STATE_PRIVATE = "private";
	private static SAMPLES_PULL_FAILED_MESSAGE = "Failed to retrieve samples list. Please try again a little bit later.";
	private static NATIVESCRIPT_SAMPLE_CUTENESS_NAME = "nativescript-sample-cuteness";
	private sampleCategories = [
		{ id: "demo-app", regEx: /(^|\s)demo($|\s)/i, name: "Demo Applications", order: 1, matchOrder: 2 },
		{ id: "core-api", regEx: /(^|\s)core($|\s)/i, name: "Core APIs", order: 2, matchOrder: 3 },
		{ id: "advanced", regEx: /\w?/, name: "Advanced APIs", order: 3, matchOrder: 4 }
	];

	private _samples: Sample[];
	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $httpClient: Server.IHttpClient,
		private $staticConfig: IStaticConfig) {
	}

	private get samples(): IFuture<Sample[]> {
		return (() => {
			if (!this._samples) {
				this._samples = this.getAllSamples().wait();
			}

			return this._samples;
		}).future<Sample[]>()();
	}

	public printSamplesInformation(): IFuture<string> {
		return (() => {
			this.$logger.info(this.getSamplesInformation().wait());
		}).future<string>()();
	}

	public cloneSample(sampleName: string): IFuture<void> {
		return (() => {
			var cloneTo = options.path || sampleName;
			if (this.$fs.exists(cloneTo).wait() && this.$fs.readDirectory(cloneTo).wait().length > 0) {
				this.$errors.fail("Cannot clone sample in the specified path. The directory %s is not empty. Specify an empty target directory and try again.", path.resolve(cloneTo));
			}

			var sample = _.find(this.samples.wait(), (sample: Sample) => sample.name.toLowerCase() === sampleName.toLowerCase());
			if (!sample) {
				this.$errors.fail("There is no sample named '%s'.", sampleName);
			}

			this.$logger.info("Cloning sample from GitHub...");
			try {
				var tempDir = temp.mkdirSync("appbuilderSamples");
				var filepath = path.join(tempDir, sampleName);
				var file = this.$fs.createWriteStream(filepath);
				var fileEnd = this.$fs.futureFromEvent(file, "finish");

				var response = this.$httpClient.httpRequest({ url: sample.zipUrl, pipeTo: file }).wait();
				fileEnd.wait();

				this.$fs.unzip(filepath, tempDir).wait();
				var projectFile = _.first(commonHelpers.enumerateFilesInDirectorySync(tempDir, (filepath, stat) => stat.isDirectory() || path.basename(filepath) === this.$staticConfig.PROJECT_FILE_NAME));
				var projectDir = path.dirname(projectFile);
				var files = commonHelpers.enumerateFilesInDirectorySync(projectDir);
				_.each(files, file => {
					var targetDir = path.join(cloneTo, file.replace(projectDir, ""));
					this.$fs.copyFile(file, targetDir).wait();
				})
			} finally {
				try {
					this.$fs.deleteDirectory(tempDir).wait();
				}
				catch (error) {
					this.$logger.debug(error);
				}
			}
		}).future<void>()();
	}

	private getSamplesInformation(): IFuture<string> {
		return (() => {
			try {
				var availableSamples = this.samples.wait();
			} catch (error) {
				return SamplesService.SAMPLES_PULL_FAILED_MESSAGE;
			}

			var sortedCategories = _.sortBy(this.sampleCategories, category => category.order);
			var categories = _.map(sortedCategories, category => {
				return {
					name: category.name,
					samples: _.filter(availableSamples, sample => sample.type === category.id)
				}
			});

			var outputLines: string[] = [];
			_.each(categories, category => {
				if (category.samples.length == 0) {
					return;
				}

				outputLines.push(util.format("%s:%s======================", category.name, os.EOL));

				_.each(category.samples, (sample: Sample) => {
					var nameRow = util.format("    Sample: %s", sample.displayName);
					var descriptionRow = util.format("    Description: %s", sample.description);
					var gitClone = util.format("    Github repository page: %s", sample.githubUrl)
					var cloneCommand = util.format("    Clone command: $ appbuilder sample clone %s", sample.name);
					outputLines.push([nameRow, descriptionRow, gitClone, cloneCommand].join(os.EOL));
				});
			});

			outputLines.unshift("You can choose a sample from the following:");
			return outputLines.join(os.EOL + os.EOL);
		}).future<string>()();
	}

	private getAllSamples(): IFuture<Sample[]> {
		return (() => {
			var iceniumOrganizationSamples = this.getRepositories(SamplesService.GITHUB_ICENIUM_LOCATION_ENDPOINT, (repo: any) => SamplesService.GITHUB_REGEX.test(repo.clone_url) && !repo[SamplesService.REMOTE_LOCK_STATE_PRIVATE]).wait();
			var telerikOrganizationSamples = this.getRepositories(SamplesService.GITHUB_TELERIK_LOCATION_ENDPOINT, (repo: any) => repo.name === SamplesService.NATIVESCRIPT_SAMPLE_CUTENESS_NAME).wait();
			var repos = _.union(iceniumOrganizationSamples, telerikOrganizationSamples);

			var samples = _.map(repos, (repo: any) => {
				return new Sample(
					repo.name.replace(SamplesService.NAME_PREFIX_REMOVAL_REGEX, ""),
					helpers.capitalizeFirstLetter(repo.name.replace(SamplesService.NAME_FORMAT_REGEX, " ").trim()),
					repo.description,
					repo.url + "/zipball/" + repo.default_branch,
					repo.html_url,
					this.getTypeFromDescription(repo.description));
			});

			var sortedSamples = _.sortBy(samples, sample => sample.displayName);

			return sortedSamples;
		}).future<Sample[]>()();
	}

	private getRepositories(gitHubEndpointUrl: string, filter: (repo: any) => boolean): IFuture<string[]> {
		return (() => {
			try {
				var repos = JSON.parse(this.$httpClient.httpRequest(gitHubEndpointUrl).wait().body);
			} catch (error) {
				this.$logger.debug(error);
				this.$errors.fail(SamplesService.SAMPLES_PULL_FAILED_MESSAGE);
			}

			repos = _.select(repos, (repo:any) => filter(repo));

			return repos;
		}).future<string[]>()();
	}

	private getTypeFromDescription(description: string): string {
		var sortedCategories = _.sortBy(this.sampleCategories, category => category.matchOrder);

		var matchedCategory = _.find(sortedCategories, category => category.regEx.test(description));
		return matchedCategory ? matchedCategory.id : null;
	}
}
$injector.register("samplesService", SamplesService);
