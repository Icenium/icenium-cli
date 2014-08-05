///<reference path="../.d.ts"/>
"use strict";
import temp = require("temp");
import path = require("path");

class UpdateKendoUICommand implements ICommand {
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

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();
			this.$project.ensureProject();
			if(!this.$project.capabilities.updateKendo) {
				this.$errors.fail("This operation is applicable only to hybrid projects.");
			}

			var packages: Server.IKendoDownloadablePackageData[] = _.filter(<Server.IKendoDownloadablePackageData[]>this.$server.kendo.getPackages().wait(), p => !p.NeedPurchase);

			this.$logger.out("You can download and install the following Kendo UI Core or Kendo UI Professional packages.");
			_.each(packages, (update: Server.IKendoDownloadablePackageData, idx: number) => {
				this.$logger.out("\t[%s] %s %s", (idx+1).toString().cyan, update.Name, update.Version);
			});

			var schema: IPromptSchema = {
				properties: {
					packageIdx: {
						required: true,
						type: "string",
						message: "Valid values are between 1 and " + packages.length,
						description: "Enter the index of the package that you want to install",
						conform: (value: string) => {
							var num = parseInt(value, 10);
							return !isNaN(num) && num >= 1 && num <= packages.length;
						}
					}
				}
			};

			this.$prompter.start();
			var choice = this.$prompter.get(schema).wait();

			var confirm = this.$prompter.confirm(
				"This operation will overwrite existing Kendo UI framework files and " +
				"any changes will be lost. ".red.bold +
				"Are you sure you want to continue?",
				() => "y").wait();
			if (!confirm) {
				return;
			}

			var packageIdx = parseInt(choice.packageIdx, 10)-1;
			var downloadUri = packages[packageIdx].DownloadUrl;
			this.updateKendoFiles(downloadUri).wait();

		}).future<void>()();
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

		}).future<void>()();
	}
}

$injector.registerCommand("update-kendoui", UpdateKendoUICommand);
