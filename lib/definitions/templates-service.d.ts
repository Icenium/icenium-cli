interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;
	configurationFiles: IConfigurationFile[];
	projectCordovaTemplatesString(): IFuture<string>;
	projectNativeScriptTemplatesString(): IFuture<string>;
	projectMobileWebsiteTemplatesString(): IFuture<string>;
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