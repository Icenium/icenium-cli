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
				this.$errors.fail("Only Hybrid projects can use Kendo UI");
			}

			var packages: Server.IKendoDownloadablePackageData[] = _.filter(<Server.IKendoDownloadablePackageData[]>this.$server.kendo.getPackages().wait(), p => !p.NeedPurchase);

			this.$logger.out("The following Kendo UI update packages are available:");
			_.each(packages, (update: Server.IKendoDownloadablePackageData, idx: number) => {
				this.$logger.out("\t[%s] %s %s", (idx+1).toString().cyan, update.Name, update.Version);
			});

			var schema: IPromptSchema = {
				properties: {
					packageIdx: {
						required: true,
						type: "string",
						message: "Valid values are between 1 and " + packages.length,
						description: "Select Kendo UI update package to download",
						conform: (value: string) => {
							var num = parseInt(value, 10);
							return !isNaN(num) && num >= 1 && num <= packages.length;
						}
					}
				}
			};

			this.$prompter.start();
			var choice = this.$prompter.get(schema).wait();

			var confirm = this.$prompter.confirm("Downloading the new Kendo UI package will overwrite existing files. " +
				"If you have made changes, they will be lost.".red.bold,
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

			var outDir = path.join(this.$project.getProjectDir(), "kendo");
			this.$fs.unzip(filepath, outDir).wait();

		}).future<void>()();
	}
}

$injector.registerCommand("update-kendoui", UpdateKendoUICommand);
