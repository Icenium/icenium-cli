///<reference path=".d.ts"/>
"use strict";

import _ = require("underscore");
import path = require("path");
import helpers = require("./helpers");
import options = require("./options");
import Future = require("fibers/future");
import util = require("util");
import unzip = require("unzip");
import MobileHelper = require("./common/mobile/mobile-helper");

export class ConfigurationFile {
	constructor(public template: string,
		public filepath: string,
		public templateFilepath: string,
		public helpText: string) { }
}

export class TemplatesService implements ITemplatesService {
	private configFiles: ConfigurationFile[];
	constructor(private $fs: IFileSystem,
		private $server: Server.IServer,
		private $resources: IResourceLoader,
		private $httpClient: Server.IHttpClient,
		private $projectTypes: IProjectTypes) {
			this.configFiles = [
				new ConfigurationFile(
					"android-manifest",
					"App_Resources/Android/AndroidManifest.xml",
					"Mobile.Android.ManifestXml.zip",
					"Opens AndroidManifest.xml for editing and creates it, if needed."
					),
				new ConfigurationFile(
					"android-config",
					"App_Resources/Android/xml/config.xml",
					"Mobile.Cordova.Android.ConfigXml.zip",
					"Opens config.xml for Android for editing and creates it, if needed."
					),
				new ConfigurationFile(
					"ios-info",
					"App_Resources/iOS/Info.plist",
					"Mobile.iOS.InfoPlist.zip",
					"Opens Info.plist for editing and creates it, if needed."
					),
				new ConfigurationFile(
					"ios-config",
					"App_Resources/iOS/config.xml",
					"Mobile.Cordova.iOS.ConfigXml.zip",
					"Opens config.xml for iOS for editing and creates it, if needed."
					),
				new ConfigurationFile(
					"wp8-manifest",
					"App_Resources/WP8/WMAppManifest.xml",
					"Mobile.WP8.WMAppManifestXml.zip",
					"Opens WMAppManifest.xml for editing and creates it, if needed."
					),
				new ConfigurationFile(
					"wp8-config",
					"App_Resources/WP8/config.xml",
					"Mobile.Cordova.WP8.ConfigXml.zip",
					"Opens config.xml for Windows Phone 8 for editing and creates it, if needed."
					),
			];
	}

	public get projectTemplatesDir(): string {
		return this.$resources.resolvePath("ProjectTemplates");
	}

	public get itemTemplatesDir(): string {
		return this.$resources.resolvePath("ItemTemplates");
	}

	public get configurationFiles(): IConfigurationFile[] {
		return this.configFiles;
	}

	public projectCordovaTemplatesString(): string {
		var templates = _.map(this.$fs.readDirectory(this.projectTemplatesDir).wait(), (file) => {
			var match = file.match(/.*Telerik\.Mobile\.Cordova\.(.+)\.zip/);
			return match && match[1];
		})
		.filter((file: string) => file !== null);

		templates = _.select(templates, (template: string) => template != null);
		return helpers.formatListOfNames(templates);
	}

	public projectNativeScriptTemplatesString(): string {
		var templates = _.map(this.$fs.readDirectory(this.projectTemplatesDir).wait(), (file) => {
			var match = file.match(/.*Telerik\.Mobile\.NativeScript\.(.+)\.zip/);
			return match && match[1];
		})
		.filter((file: string) => file !== null);
		return helpers.formatListOfNames(templates);
	}

	public configurationFilesString(): string {
		return _.map(this.configurationFiles, (file) => {
			return util.format("        %s - %s", file.template, file.helpText);
		}).join("\n");
	}

	public getTemplateFilename(projectType: number, name: string): string {
		return util.format("Telerik.Mobile.%s.%s.zip", this.$projectTypes[projectType], name);
	}

	public downloadProjectTemplates(): IFuture<void> {
		return (() => {
			var templates = this.$server.projects.getProjectTemplates().wait();
			var templatesDir = this.projectTemplatesDir;
			this.$fs.deleteDirectory(templatesDir).wait();
			this.$fs.createDirectory(templatesDir).wait();
			
			_.each(templates, (template) => this.downloadTemplate(template, templatesDir).wait());
		}).future<void>()();
	}

	public downloadItemTemplates(): IFuture<void> {
		return (() => {
			var templates = this.$server.projects.getItemTemplates().wait();
			var templatesDir = this.itemTemplatesDir;
			this.$fs.deleteDirectory(templatesDir).wait();
			this.$fs.createDirectory(templatesDir).wait();

			_.each(templates, (template) => {
				if (template["Category"] == "Configuration") {
					this.downloadTemplate(template, templatesDir).wait();
				}
			});
		}).future<void>()();
	}

	public unpackAppResources(): IFuture<void> {
		return (() => {
			var appResourcesDir = this.$resources.appResourcesDir;
			this.$fs.deleteDirectory(appResourcesDir).wait();

			var assetsZipFileName = path.join(this.projectTemplatesDir, "Telerik.Mobile.Cordova.Blank.zip");
			var unzipOps:IFuture<any>[] = [];
			var unzipStream = this.$fs.createReadStream(assetsZipFileName)
				.pipe(unzip.Parse())
				.on("entry", (entry: ZipEntry) => {
					if (entry.type !== "File" || !entry.path.toLowerCase().startsWith("app_resources/")) {
						entry.autodrain();
						return;
					}
					var assetTargetFileName = path.join(appResourcesDir, entry.path);
					var mkdirFuture = this.$fs.createDirectory(path.dirname(assetTargetFileName));
					mkdirFuture.resolve((err) => {
						if (err) {
							var errFuture = new Future();
							errFuture.throw(err);
							unzipOps.push(errFuture);
							entry.autodrain();
						} else {
							var assetTargetFile = this.$fs.createWriteStream(assetTargetFileName);
							unzipOps.push(this.$fs.futureFromEvent(assetTargetFile, "finish"));
							entry.pipe(assetTargetFile);
						}
					});
				});
			this.$fs.futureFromEvent(unzipStream, "close").wait();
			Future.wait(unzipOps); //SAFE: no FiberFuture's created here
		}).future<void>()();
	}

	private downloadTemplate(template: any, templatesDir: string): IFuture<void> {
		return (() => {
			var downloadUri = template.DownloadUri;
			var name = path.basename(downloadUri);
			var filepath = path.join(templatesDir, name);
			var file = this.$fs.createWriteStream(filepath);
			var fileEnd = this.$fs.futureFromEvent(file, "finish");

			var response = this.$httpClient.httpRequest({ url: downloadUri, pipeTo: file }).wait();
			fileEnd.wait();
		}).future<void>()();
	}
}
$injector.register("templatesService", TemplatesService);
