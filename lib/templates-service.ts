import * as path from "path";
import * as helpers from "./helpers";
import Future = require("fibers/future");
import * as unzip from "unzip";

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

	public getTemplatesString(regexp: RegExp, replacementNames: IStringDictionary): IFuture<string> {
		return (() => {
			let templates = _(this.$fs.readDirectory(this.projectTemplatesDir).wait())
				.map((file) => {
					let match = file.match(regexp),
						templateName = match && match[1],
						replacementName = templateName && replacementNames[templateName.toLowerCase()];

					return replacementName || templateName;
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
				if (template["Category"] === "Configuration") {
					this.downloadTemplate(template, templatesDir).wait();
				}
			});
		}).future<void>()();
	}

	public unpackAppResources(): IFuture<void> {
		return (() => {
			let cordovaAssetsZipFileName = path.join(this.projectTemplatesDir, "Telerik.Mobile.Cordova.Blank.zip");
			this.unpackAppResourcesCore(this.$resources.resolvePath("Cordova"), cordovaAssetsZipFileName).wait();
			let nsAssetsZipFileName = path.join(this.projectTemplatesDir, "Telerik.Mobile.NS.Blank.zip");
			this.unpackAppResourcesCore(this.$resources.resolvePath("NativeScript"), nsAssetsZipFileName).wait();
		}).future<void>()();
	}

	private unpackAppResourcesCore(appResourcesDir: string, assetsZipFileName: string): IFuture<void> {
		return (() => {
			let unzipOps:IFuture<any>[] = [];
			let unzipStream = this.$fs.createReadStream(assetsZipFileName)
				.pipe(unzip.Parse())
				.on("entry", (entry: ZipEntry) => {
					let indexOfAppResources = entry.path.toLowerCase().indexOf("app_resources/");
					if (entry.type !== "File" || indexOfAppResources === -1) {
						entry.autodrain();
						return;
					}

					let entryPath = entry.path.substr(indexOfAppResources);
					let assetTargetFileName = path.join(appResourcesDir, entryPath);
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

			this.$httpClient.httpRequest({ url: downloadUri, pipeTo: file }).wait();
			fileEnd.wait();
		}).future<void>()();
	}
}
$injector.register("templatesService", TemplatesService);
