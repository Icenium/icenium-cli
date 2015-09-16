///<reference path="../.d.ts"/>
"use strict";
import temp = require("temp");
import * as path from "path";
import {KendoUIBaseCommand} from "./kendoui-base";

class KendoUIInstallCommand extends KendoUIBaseCommand implements ICommand {

	constructor(private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $opener: IOpener,
		private $prompter: IPrompter,
		$errors: IErrors,
		$kendoUIService: IKendoUIService,
		$loginManager: ILoginManager,
		$options: IOptions,
		$project: Project.IProject) {

		super($errors, $project, $kendoUIService, $loginManager, $options);
	}

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let packages = this.getKendoPackages().wait();

			let downloadUri: string;
			if(this.$options.latest) {
				let latestPackage = _.first(packages);
				let sameDateItems = _.filter(packages, pack => pack.Version === latestPackage.Version);
				if(sameDateItems.length > 1) {
					downloadUri = this.selectKendoVersion(sameDateItems).wait();
				} else {
					downloadUri = latestPackage.DownloadUrl;
				}
			} else {
				downloadUri = this.selectKendoVersion(packages).wait();
			}

			let confirm = this.$options.force || this.$prompter.confirm(
				"This operation will overwrite existing Kendo UI framework files and " +
				"any changes will be lost. ".red.bold +
				"Are you sure you want to continue?",
				() => true).wait();
			if (!confirm) {
				return;
			}

			this.updateKendoFiles(downloadUri).wait();

		}).future<void>()();
	}

	private selectKendoVersion(packages: Server.IKendoDownloadablePackageData[]): IFuture<string> {
		return ((): string => {
			this.$logger.out("You can download and install the following Kendo UI packages.");
			this.$logger.out(this.getKendoPackagesAsTable(packages));
			let schema: IPromptSchema = {
				type: "input",
				name: "packageIdx",
				message: "Enter the index of the package that you want to install.",
				validate: (value: string) => {
					let num = parseInt(value, 10);
					return !isNaN(num) && num >= 1 && num <= packages.length ? true : `Valid values are between 1 and ${packages.length}.`;
				}
			};

			let choice = this.$prompter.get([schema]).wait();
			let packageIdx = parseInt(choice.packageIdx, 10) - 1;
			let selectedPackage = packages[packageIdx];
			if (selectedPackage.HasReleaseNotes) {
				let shouldShowReleaseNotes = this.$prompter.confirm(
				"Do you want to review the release notes for this package?",
				() => true).wait();
				if (shouldShowReleaseNotes) {
					this.$opener.open(selectedPackage.ReleaseNotesUrl);
				}
			}

			this.$logger.trace("The selected package is:");
			this.$logger.trace(selectedPackage);
			return selectedPackage.DownloadUrl;
		}).future<string>()();
	}

	private updateKendoFiles(downloadUri: string): IFuture<void> {
		return (() => {
			temp.track();

			let filepath = temp.path({suffix: ".zip", prefix: "abkendoupdate-"});
			let file = this.$fs.createWriteStream(filepath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");
			this.$httpClient.httpRequest({ url: downloadUri, pipeTo: file }).wait();
			fileEnd.wait();

			let outDir = path.join(this.$project.getProjectDir().wait(), "kendo"),
				backupFolder = `${outDir}.ab-backup`;

			try {
				if (this.$fs.exists(outDir).wait()) {
					this.$fs.rename(outDir, backupFolder).wait();
				}

				this.$fs.unzip(filepath, outDir).wait();
			} catch (error) {
				if (error.code === "EPERM") {
					this.$errors.failWithoutHelp(`Permission denied, make sure ${outDir} is not locked.`);
				}

				this.$fs.rename(backupFolder, outDir).wait();
				throw error;
			} finally {
				this.$fs.deleteDirectory(backupFolder).wait();
			}

			this.$logger.info("Successfully updated Kendo UI.");
		}).future<void>()();
	}
}

$injector.registerCommand("update-kendoui", KendoUIInstallCommand);
$injector.registerCommand("kendoui|install", KendoUIInstallCommand);
