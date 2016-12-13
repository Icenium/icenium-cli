import temp = require("temp");
import * as path from "path";
import * as util from "util";
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

			let selectedPackage = this.selectKendoVersion(packages).wait();

			let confirm = this.$options.force || this.$prompter.confirm(
				"This operation will overwrite existing Kendo UI framework files and " +
				"any changes will be lost. ".red.bold +
				"Are you sure you want to continue?",
				() => true).wait();
			if (!confirm) {
				return;
			}

			this.updateKendoFiles(selectedPackage.DownloadUrl, selectedPackage.Version).wait();

		}).future<void>()();
	}

	private selectKendoVersion(packages: Server.IKendoDownloadablePackageData[]): IFuture<Server.IKendoDownloadablePackageData> {
		return ((): Server.IKendoDownloadablePackageData => {
			let selectedPackage: Server.IKendoDownloadablePackageData;
			if (packages.length === 1) {
				selectedPackage = _.first(packages);
			} else {
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
				selectedPackage = packages[packageIdx];
			}

			if (selectedPackage.HasReleaseNotes && !this.$options.force) {
				let shouldShowReleaseNotes = this.$prompter.confirm(
				"Do you want to review the release notes for this package?",
				() => true).wait();
				if (shouldShowReleaseNotes) {
					this.$opener.open(selectedPackage.ReleaseNotesUrl);
				}
			}

			this.$logger.trace("The selected package is:");
			this.$logger.trace(selectedPackage);
			return selectedPackage;
		}).future<Server.IKendoDownloadablePackageData>()();
	}

	private updateKendoFiles(downloadUri: string, version: string): IFuture<void> {
		return (() => {
			temp.track();

			let filepath = temp.path({suffix: ".zip", prefix: "abkendoupdate-"});
			let file = this.$fs.createWriteStream(filepath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");
			this.$httpClient.httpRequest({ url: downloadUri, pipeTo: file }).wait();
			fileEnd.wait();

			let outDir = path.join(this.$project.getProjectDir(), "kendo"),
				backupFolder = `${outDir}.ab-backup`;

			try {
				if (this.$fs.exists(outDir)) {
					this.$fs.rename(outDir, backupFolder);
				}

				this.$fs.unzip(filepath, outDir).wait();
			} catch (error) {
				if (error.code === "EPERM") {
					this.$errors.failWithoutHelp(`Permission denied, make sure ${outDir} is not locked.`);
				}

				this.$fs.rename(backupFolder, outDir);
				throw error;
			} finally {
				this.$fs.deleteDirectory(backupFolder);
			}

			this.$logger.printMarkdown(util.format("Successfully updated Kendo UI to version `%s`.", version));
		}).future<void>()();
	}
}

$injector.registerCommand("update-kendoui", KendoUIInstallCommand);
$injector.registerCommand("kendoui|install", KendoUIInstallCommand);
