///<reference path="../.d.ts"/>

"use strict";

import util = require("util");
import path = require("path");
import xopen = require("open");
import unzip = require("unzip");
import _ =  require("underscore");

export class EditConfigurationCommandData implements Commands.ICommandData {
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

export class EditConfigurationCommandDataFactory implements Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]): EditConfigurationCommandData {
		return new EditConfigurationCommandData(args);
	}
}
$injector.register("editConfigurationCommandDataFactory", EditConfigurationCommandDataFactory);

export class EditConfigurationCommand implements Commands.ICommand<any> {
	constructor(private $editConfigurationCommandDataFactory: EditConfigurationCommandDataFactory,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $commandsService: ICommandsService) {
	}

	public getDataFactory(): EditConfigurationCommandDataFactory {
		return this.$editConfigurationCommandDataFactory;
	}

	canExecute(data:any):boolean {
		return true;
	}

	execute(data: EditConfigurationCommandData): void {
		if (data.template) {
			var directory = path.dirname(data.template.filepath);
			if (!this.$fs.exists(data.template.filepath).wait()) {
				var templateFilePath = path.join(__dirname, "../../resources/configuration", data.template.templateFileName);
				this.$fs.futureFromEvent(
					this.$fs.createReadStream(templateFilePath)
						.pipe(unzip.Extract({ path: directory})), "close").wait();

				//delete extra file in template zip
				this.$fs.deleteFile(path.join(directory, "server.vstemplate")).wait();
			}

			xopen(data.template.filepath);
		}
		else {
			this.$commandsService.executeCommand("help", ["edit-configuration"]);
		}
	}
}
$injector.registerCommand("edit-configuration", EditConfigurationCommand);