interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;
	getTemplatesString(regexp: RegExp): IFuture<string>;
	downloadProjectTemplates(): IFuture<void>;
	downloadItemTemplates(): IFuture<void>;
	unpackAppResources(): IFuture<void>;
}