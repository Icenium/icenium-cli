interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;
	configurationFiles: IConfigurationFile[];
	appResourcesDir: string;
	projectTemplatesString(): string;
	buildCordovaJsFilePath(version: string, platform: string): string;
	getTemplateFilename(name: string): string;
	downloadProjectTemplates(): IFuture<void>;
	downloadItemTemplates(): IFuture<void>;
	unpackAppResources(): IFuture<void>;
	downloadCordovaJsFiles(): IFuture<void>;
}

interface IConfigurationFile {
	template: string;
	filepath: string;
	templateFilepath: string;
	helpText: string;
}