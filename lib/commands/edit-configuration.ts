///<reference path="../.d.ts"/>

"use strict";

import util = require("util");
import path = require("path");
import xopen = require("open");
import unzip = require("unzip");
import _ = require("underscore");
import helpers = require("../helpers");

class EditConfigurationCommandData {
	private static ConfigurationFiles = [
		{ template: "android-manifest", filepath: "App_Resources/Android/AndroidManifest.xml", templateFileName: "Mobile.Android.ManifestXml.zip" },
		{ template: "android-config", filepath: "App_Resources/Android/xml/config.xml", templateFileName: "Mobile.Cordova.Android.ConfigXml.zip" },
		{ template: "ios-info", filepath: "App_Resources/iOS/Info.plist", templateFileName: "Mobile.iOS.InfoPlist.zip" },
		{ template: "ios-config", filepath: "App_Resources/iOS/config.xml", templateFileName: "Mobile.Cordova.iOS.ConfigXml.zip" },
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
		private $errors: IErrors) {
	}

	execute(args: string[]): void {
		(() => {
			var data = new EditConfigurationCommandData(args);
			this.executeImplementation(data).wait();
		}).future<void>()().wait();
	}

	private executeImplementation(data: EditConfigurationCommandData): IFuture<void> {
		return (() => {
			if (data.template) {
				var directory = path.dirname(data.template.filepath);
				if (!this.$fs.exists(data.template.filepath).wait()) {
					this.$logger.info("Creating configuration file: " + data.template.filepath);
					var templateFilePath = path.join(__dirname, "../../resources/configuration", data.template.templateFileName);
					this.$fs.futureFromEvent(
						this.$fs.createReadStream(templateFilePath)
							.pipe(unzip.Extract({ path: directory })), "close").wait();

					//delete extra file in template zip
					this.$fs.deleteFile(path.join(directory, "server.vstemplate")).wait();
					if (helpers.isWindows()) {
						var contents = this.$fs.readText(data.template.filepath).wait();
						contents = helpers.stringReplaceAll(contents, "\n", "\r\n");
						this.$fs.writeFile(data.template.filepath, contents).wait();
					}
				}

				this.$logger.info("Opening configuration file: " + data.template.filepath);
				xopen(data.template.filepath);
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