import * as path from "path";
import * as util from "util";
import {EOL} from "os";
import temp = require("temp");
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/mobile/constants";

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
	private static GITHUB_REGEX = /https:\/\/github[.]com\/Icenium\/(?!deprecated-)(sample-|.*?-sample-)[\w\W]+[.]git$/i;
	private static NAME_FORMAT_REGEX = /(nativescript-)?(sample-|-)/gi;
	private static NAME_PREFIX_REMOVAL_REGEX = /sample-/i;
	private static REMOTE_LOCK_STATE_PRIVATE = "private";
	private static SAMPLES_PULL_FAILED_MESSAGE = "Failed to retrieve samples list. Please try again a little bit later.";
	private static GITHUB_CORDOVA_SAMPLES_REGEX = new RegExp("https:\/\/github[.]com\/Icenium\/sample-[\\w\\W]+[.]git$", "i");
	private static GITHUB_NS_SAMPLES_REGEX = new RegExp("https:\/\/github[.]com\/Icenium\/nativescript-sample-[\\w\\W]+[.]git$", "i");
	private sampleCategories = [
		{ id: "demo-app", regEx: /(^|\s)demo($|\s)/i, name: "Demo Applications", order: 1, matchOrder: 2 },
		{ id: "core-api", regEx: /(^|\s)core($|\s)/i, name: "Core APIs", order: 2, matchOrder: 3 },
		{ id: "advanced", regEx: /\w?/, name: "Advanced APIs", order: 3, matchOrder: 4 }
	];

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $staticConfig: IStaticConfig,
		private $options: IOptions) {
	}

	public printSamplesInformation(framework?: string): IFuture<void> {
		return (() => {
			this.$logger.info("You can choose a sample from the following: %s", EOL);
			if(framework) {
				this.printSamplesInformationForFramework(framework).wait();
			} else {
				_.values(TARGET_FRAMEWORK_IDENTIFIERS).forEach(fx => this.printSamplesInformationForFramework(fx).wait());
			}
		}).future<void>()();
	}

	private printSamplesInformationForFramework(framework: string): IFuture<void> {
		return (() => {
			this.$logger.info("%s samples:%s=========================%s", framework, EOL, EOL);
			this.$logger.info(this.getSamplesInformation(framework).wait() + EOL + EOL);
		}).future<void>()();
	}

	public cloneSample(sampleName: string): IFuture<void> {
		return (() => {
			let cloneTo = this.$options.path || sampleName;
			if (this.$fs.exists(cloneTo).wait() && this.$fs.readDirectory(cloneTo).wait().length > 0) {
				this.$errors.fail("Cannot clone sample in the specified path. The directory %s is not empty. Specify an empty target directory and try again.", path.resolve(cloneTo));
			}

			let sampleNameLower = sampleName.toLowerCase();
			let sample = _.find(this.getSamples().wait(), (_sample: Sample) => _sample.name.toLowerCase() === sampleNameLower);
			if (!sample) {
				this.$errors.fail("There is no sample named '%s'.", sampleName);
			}

			this.$logger.info("Cloning sample from GitHub...");
			let tempDir: string;
			try {
				temp.track();
				tempDir = temp.mkdirSync("appbuilderSamples");
				let filepath = path.join(tempDir, sampleName);
				let file = this.$fs.createWriteStream(filepath);
				let fileEnd = this.$fs.futureFromEvent(file, "finish");
				let accessToken = this.getGitHubAccessTokenQueryParameter("?").wait();
				this.$httpClient.httpRequest({ url: `${sample.zipUrl}${accessToken}`, pipeTo: file }).wait();
				fileEnd.wait();

				this.$fs.unzip(filepath, tempDir).wait();
				let projectFile = _.first(this.$fs.enumerateFilesInDirectorySync(tempDir, (filepath, stat) => stat.isDirectory() || path.basename(filepath) === this.$staticConfig.PROJECT_FILE_NAME));
				let projectDir = path.dirname(projectFile);
				let files = this.$fs.enumerateFilesInDirectorySync(projectDir);
				_.each(files, file => {
					let targetDir = path.join(cloneTo, file.replace(projectDir, ""));
					this.$fs.copyFile(file, targetDir).wait();
				});
			} finally {
				try {
					this.$fs.deleteDirectory(tempDir).wait();
				} catch (error) {
					this.$logger.debug(error);
				}
			}
		}).future<void>()();
	}

	private getSamplesInformation(framework: string): IFuture<string> {
		return (() => {
			let availableSamples: Sample[];
			try {
				availableSamples = this.getSamples(framework).wait();
			} catch (error) {
				return SamplesService.SAMPLES_PULL_FAILED_MESSAGE;
			}

			let sortedCategories = _.sortBy(this.sampleCategories, category => category.order);
			let categories = _.map(sortedCategories, category => {
				return {
					name: category.name,
					samples: _.filter(availableSamples, sample => sample.type === category.id)
				};
			});

			let outputLines: string[] = [];
			_.each(categories, category => {
				if (category.samples.length === 0) {
					return;
				}

				outputLines.push(util.format("   %s:%s   ======================", category.name, EOL));

				_.each(category.samples, (sample: Sample) => {
					let nameRow = util.format("      Sample: %s", sample.displayName);
					let descriptionRow = util.format("      Description: %s", sample.description);
					let gitClone = util.format("      Github repository page: %s", sample.githubUrl);
					let cloneCommand = util.format("      Clone command: $ appbuilder sample clone %s", sample.name);
					outputLines.push([nameRow, descriptionRow, gitClone, cloneCommand].join(EOL));
				});
			});

			return outputLines.join(EOL + EOL);
		}).future<string>()();
	}

	private getRegExpForFramework(framework?: string): RegExp {
		framework = framework || "";
		switch(framework.toLowerCase()) {
			case TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase():
				return SamplesService.GITHUB_NS_SAMPLES_REGEX;
			case TARGET_FRAMEWORK_IDENTIFIERS.Cordova.toLowerCase():
				return SamplesService.GITHUB_CORDOVA_SAMPLES_REGEX;
			default:
				return SamplesService.GITHUB_REGEX;
		}
	}

	private getSamples(framework?: string): IFuture<Sample[]> {
		return (() => {
			let regex = this.getRegExpForFramework(framework);
			let repos = _.select(this.getIceniumRepositories().wait(),(repo: any) => regex.test(repo.clone_url) && !repo[SamplesService.REMOTE_LOCK_STATE_PRIVATE]);
			let samples = _.map(repos, (repo: any) => {
				return new Sample(
					repo.name.replace(SamplesService.NAME_PREFIX_REMOVAL_REGEX, ""),
					repo.name.replace(SamplesService.NAME_FORMAT_REGEX, " ").trim(),
					repo.description,
					repo.url + "/zipball/" + repo.default_branch,
					repo.html_url,
					this.getTypeFromDescription(repo.description));
			});

			let sortedSamples = _.sortBy(samples, sample => sample.displayName);

			return sortedSamples;
		}).future<Sample[]>()();
	}

	private getPagedResult(gitHubEndpointUrl: string, page: number): IFuture<string[]> {
		return (() => {
			try {
				let requestUrl = gitHubEndpointUrl + "&page=" + page.toString();
				let accessToken = this.getGitHubAccessTokenQueryParameter("&").wait();
				let result = JSON.parse(this.$httpClient.httpRequest(`${requestUrl}${accessToken}`).wait().body);
				return result;
			} catch (error) {
				this.$logger.debug(error);
				this.$errors.fail(SamplesService.SAMPLES_PULL_FAILED_MESSAGE);
			}

		}).future<string[]>()();
	}

	private _repos: string[];

	private getIceniumRepositories(): IFuture<string[]> {
		return ((): string[] => {
			if(!this._repos) {
				let gitHubEndpointUrl = SamplesService.GITHUB_ICENIUM_LOCATION_ENDPOINT;
				this._repos = [];

				for(let page = 1; ; ++page) {
					let pagedResult = this.getPagedResult(gitHubEndpointUrl, page).wait();
					if(_.isEmpty(pagedResult)) {
						break;
					}
					Array.prototype.push.apply(this._repos, pagedResult);
				}
			}

			return this._repos;
		}).future<string[]>()();
	}

	private getTypeFromDescription(description: string): string {
		let sortedCategories = _.sortBy(this.sampleCategories, category => category.matchOrder);

		let matchedCategory = _.find(sortedCategories, category => category.regEx.test(description));
		return matchedCategory ? matchedCategory.id : null;
	}

	private getGitHubAccessTokenQueryParameter(queryToken: string): IFuture<string> {
		return ((): string => {
			let accessToken = "";
			let tokenFile = this.$staticConfig.GITHUB_ACCESS_TOKEN_FILEPATH;
			try {
				let content = this.$fs.readFile(tokenFile).wait();
				if(content) {
					accessToken = `${queryToken}access_token=${content}`;
				}
			} catch(err) {
				if(err.code !== "ENOENT") {
					this.$logger.trace(`Error happened while trying to open '${tokenFile}'. Error is: ${err}`);
				} else {
					this.$logger.trace(`File '${tokenFile}' does not exist. GitHub api calls will be executed without access_token.`);
				}
			}

			return accessToken;
		}).future<string>()();
	}
}
$injector.register("samplesService", SamplesService);
