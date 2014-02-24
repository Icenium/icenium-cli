///<reference path="../.d.ts"/>

"use strict";

import util = require("util");
import path = require("path");
import unzip = require("unzip");
import _ = require("underscore");
import helpers = require("../helpers");

export class EditConfigurationCommandData {
	public static ConfigurationFiles = [
		{ template: "android-manifest", filepath: "App_Resources/Android/AndroidManifest.xml", templatefilepath: "Mobile.Android.ManifestXml.zip" },
		{ template: "android-config", filepath: "App_Resources/Android/xml/config.xml", templatefilepath: "Mobile.Cordova.Android.ConfigXml.zip" },
		{ template: "ios-info", filepath: "App_Resources/iOS/Info.plist", templatefilepath: "Mobile.iOS.InfoPlist.zip" },
		{ template: "ios-config", filepath: "App_Resources/iOS/config.xml", templatefilepath: "Mobile.Cordova.iOS.ConfigXml.zip" },
	];

	public template: any;
	public file: string;

	constructor(private args: string[]) {
		if (args.length != 1) {
			return;
		}

		this.file = args[0];
		this.template = _.findWhere(EditConfigurationCommandData.ConfigurationFiles, { template: this.file });
	}
}

export class EditConfigurationCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $opener: IOpener,
		private $project: Project.IProject) {
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			var data = new EditConfigurationCommandData(args);
			this.executeImplementation(data).wait();
		}).future<void>()();
	}

	private executeImplementation(data: EditConfigurationCommandData): IFuture<void> {
		return (() => {
			if (data.template) {
				var projectPath = this.$project.getProjectDir();
				var filepath = path.join(projectPath, data.template.filepath);
				var directory = path.dirname(filepath);
				if (!this.$fs.exists(filepath).wait()) {
					this.$logger.info("Creating configuration file: " + filepath);
					var templateFilePath = path.join(__dirname, "../../resources/configuration", data.template.templatefilepath);
					this.$fs.futureFromEvent(
						this.$fs.createReadStream(templateFilePath)
							.pipe(unzip.Extract({ path: directory })), "close").wait();

					//delete extra file in template zip
					this.$fs.deleteFile(path.join(directory, "server.vstemplate")).wait();
					if (helpers.isWindows()) {
						var contents = this.$fs.readText(filepath).wait();
						contents = helpers.stringReplaceAll(contents, "\n", "\r\n");
						this.$fs.writeFile(filepath, contents).wait();
					}
				}

				this.$logger.info("Opening configuration file: " + filepath);
				this.$opener.open(filepath);
			}
			else {
				if (data.file) {
					this.$errors.fail("There is no matching configuration file for: %s", data.file);
				}
				else {
					this.$errors.fail("You must choose which configuration file to edit!");
				}
			}
		}).future<void>()();
	}
}
$injector.registerCommand("edit-configuration", EditConfigurationCommand);