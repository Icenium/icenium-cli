///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import helpers = require("./helpers");
import options = require("./common/options");
import Future = require("fibers/future");
import util = require("util");
import unzip = require("unzip");

export class ConfigurationFile {
	constructor(public template: string,
		public filepath: string,
		public templateFilepath: string,
		public helpText: string) { }
}

export class TemplatesService implements ITemplatesService {
	constructor(private $fs: IFileSystem,
		private $server: Server.IServer,
		private $resources: IResourceLoader,
		private $httpClient: Server.IHttpClient) { }

	public get projectTemplatesDir(): string {
		return this.$resources.resolvePath("ProjectTemplates");
	}

	public get itemTemplatesDir(): string {
		return this.$resources.resolvePath("ItemTemplates");
	}

	public getTemplatesString(regexp: RegExp): IFuture<string> {
		return (() => {
			let templates = _(this.$fs.readDirectory(this.projectTemplatesDir).wait())
				.map((file) => {
					let match = file.match(regexp);
					return match && match[1];
				})
				.filter((file: string) => file !== null)
				.value();
			return helpers.formatListOfNames(templates);
		}).future<string>()();
	}

	public downloadProjectTemplates(): IFuture<void> {
		return (() => {
			let templates = this.$server.projects.getProjectTemplates().wait();
			let templatesDir = this.projectTemplatesDir;
			this.$fs.deleteDirectory(templatesDir).wait();
			this.$fs.createDirectory(templatesDir).wait();
			
			_.each(templates, (template) => this.downloadTemplate(template, templatesDir).wait());
		}).future<void>()();
	}

	public downloadItemTemplates(): IFuture<void> {
		return (() => {
			let templates = this.$server.projects.getItemTemplates().wait();
			let templatesDir = this.itemTemplatesDir;
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
			let appResourcesDir = this.$resources.appResourcesDir;
			this.$fs.deleteDirectory(appResourcesDir).wait();

			let assetsZipFileName = path.join(this.projectTemplatesDir, "Telerik.Mobile.Cordova.Blank.zip");
			let unzipOps:IFuture<any>[] = [];
			let unzipStream = this.$fs.createReadStream(assetsZipFileName)
				.pipe(unzip.Parse())
				.on("entry", (entry: ZipEntry) => {
					if (entry.type !== "File" || !_.startsWith(entry.path.toLowerCase(), "app_resources/")) {
						entry.autodrain();
						return;
					}
					let assetTargetFileName = path.join(appResourcesDir, entry.path);
					let mkdirFuture = this.$fs.createDirectory(path.dirname(assetTargetFileName));
					mkdirFuture.resolve((err) => {
						if (err) {
							let errFuture = new Future();
							errFuture.throw(err);
							unzipOps.push(errFuture);
							entry.autodrain();
						} else {
							let assetTargetFile = this.$fs.createWriteStream(assetTargetFileName);
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
			let downloadUri = template.DownloadUri;
			let name = path.basename(downloadUri);
			let filepath = path.join(templatesDir, name);
			let file = this.$fs.createWriteStream(filepath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");

			let response = this.$httpClient.httpRequest({ url: downloadUri, pipeTo: file }).wait();
			fileEnd.wait();
		}).future<void>()();
	}
}
$injector.register("templatesService", TemplatesService);
