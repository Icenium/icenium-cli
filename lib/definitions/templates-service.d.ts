interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;
	configurationFiles: IConfigurationFile[];
	projectCordovaTemplatesString(): string;
	projectNativeScriptTemplatesString(): string;
	getTemplateFilename(projectType: number, name: string): string;
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