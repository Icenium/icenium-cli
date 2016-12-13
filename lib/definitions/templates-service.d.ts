interface ITemplatesService {
	projectTemplatesDir: string;
	itemTemplatesDir: string;

	/**
	 * Gets all templates matching specified regular expression.
	 * @param {RegExp} regexp Regular expression to be used for filtering.
	 * @param {IStringDictionary} Dictionary describing a name that should be used instead of another one.
	 * The keys are original names, values are the replacement names.
	 * @returns {string} A string including list of all available templates.
	 */
	getTemplatesString(regexp: RegExp, replacementNames: IStringDictionary): string;
	downloadProjectTemplates(): IFuture<void>;
	downloadItemTemplates(): IFuture<void>;
	unpackAppResources(): IFuture<void>;
}