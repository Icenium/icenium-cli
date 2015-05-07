///<reference path="../.d.ts"/>
"use strict";
import temp = require("temp");
import path = require("path");
import options = require("../common/options");
var Table = require("cli-table");

class UpdateKendoUICommand implements ICommand {
	private static VERIFIED_TAG = "verified";
	private static KENDO_CORE = "Kendo UI Core";
	private static KENDO_PROFESSIONAL = "Kendo UI Professional";

	constructor(
		private $errors: IErrors
		,private $logger: ILogger
		,private $project: Project.IProject
		,private $loginManager: ILoginManager
		,private $server: Server.IServer
		,private $prompter: IPrompter
		,private $fs: IFileSystem
		,private $httpClient: Server.IHttpClient
		) {	}

	allowedParameters: ICommandParameter[] = [];

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			if(args && args.length > 0) {
				this.$errors.fail("This command does not accept parameters.");
			}

			if(options.core && options.professional) {
				this.$errors.fail("You cannot specify core and professional options simultaneously.");
			}

			return true;
		}).future<boolean>()();
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();
			this.$project.ensureProject();
			if(!this.$project.capabilities.updateKendo) {
				this.$errors.fail("This operation is applicable only to hybrid projects.");
			}

			var packages: Server.IKendoDownloadablePackageData[] = _.filter(<Server.IKendoDownloadablePackageData[]>this.$server.kendo.getPackages().wait(), p => !p.NeedPurchase);
			if(options.verified) {
				packages = _.filter(packages, pack => _.any(pack.VersionTags, tag => tag.toLowerCase() === UpdateKendoUICommand.VERIFIED_TAG));
			}

			if(options.core) {
				packages = _.filter(packages, pack => pack.Name === UpdateKendoUICommand.KENDO_CORE);
			}

			if(options.professional) {
				packages = _.filter(packages, pack => pack.Name === UpdateKendoUICommand.KENDO_PROFESSIONAL);
			}

			var downloadUri: string;
			if(options.latest) {
				var latestPackage = _.first(packages);
				var sameDateItems = _.filter(packages, pack => pack.Version === latestPackage.Version);
				if(sameDateItems.length > 1) {
					downloadUri = this.selectKendoVersion(sameDateItems).wait();
				} else {
					downloadUri = latestPackage.DownloadUrl;
				}
			} else {
				downloadUri = this.selectKendoVersion(packages).wait();
			}

			var confirm = this.$prompter.confirm(
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
			this.showAvailableVersions(packages);
			var schema: IPromptSchema = {
				type: "input",
				name: "packageIdx",
				message: "Enter the index of the package that you want to install",
				validate: (value: string) => {
					var num = parseInt(value, 10);
					return !isNaN(num) && num >= 1 && num <= packages.length ? true : "Valid values are between 1 and " + packages.length;
				}
			};

			var choice = this.$prompter.get([schema]).wait();
			var packageIdx = parseInt(choice.packageIdx, 10) - 1;
			var selectedPackage = packages[packageIdx];
			this.$logger.trace("Selected package is:");
			this.$logger.trace(selectedPackage);
			return selectedPackage.DownloadUrl;
		}).future<string>()();
	}

	private showAvailableVersions(packages: Server.IKendoDownloadablePackageData[]): void {
		this.$logger.out("You can download and install the following Kendo UI packages.");
		var table = new Table({
			head: ["#", "KendoUI", "Version", "Tags"],
			chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
		});

		_.each(packages,(update: Server.IKendoDownloadablePackageData, idx: number) => table.push([
			(idx + 1).toString().cyan.toString(),
			update.Name,
			update.Version,
			(update.VersionTags || []).join(", ").cyan.toString()
		]));

		this.$logger.out(table.toString());
	}

	private updateKendoFiles(downloadUri: string): IFuture<void> {
		return (() => {
			temp.track();

			var filepath = temp.path({suffix: ".zip", prefix: "abkendoupdate-"});
			var file = this.$fs.createWriteStream(filepath);
			var fileEnd = this.$fs.futureFromEvent(file, "finish");
			var response = this.$httpClient.httpRequest({ url: downloadUri, pipeTo: file }).wait();
			fileEnd.wait();

			var outDir = path.join(this.$project.getProjectDir().wait(), "kendo");
			this.$fs.unzip(filepath, outDir).wait();
			this.$logger.info("Successfully updated Kendo package.");
		}).future<void>()();
	}
}

$injector.registerCommand("update-kendoui", UpdateKendoUICommand);
