interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;
	configurationFiles: IConfigurationFile[];
	projectTemplatesString(): string;
	getTemplateFilename(name: string): string;
	downloadProjectTemplates(): IFuture<void>;
	downloadItemTemplates(): IFuture<void>;
	unpackAppResources(): IFuture<void>;
}

interface IConfigurationFile {
	template: string;
	filepath: string;
	templateFilepath: string;
	helpText: string;
}