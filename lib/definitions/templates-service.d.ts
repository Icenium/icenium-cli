interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;
	getTemplatesString(regexp: RegExp, replacementNames: IStringDictionary): IFuture<string>;
	downloadProjectTemplates(): IFuture<void>;
	downloadItemTemplates(): IFuture<void>;
	unpackAppResources(): IFuture<void>;
}