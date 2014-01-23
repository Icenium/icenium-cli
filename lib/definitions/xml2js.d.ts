declare module "xml2js" {
	import saxjs = require("saxjs");

	export function parseString(xmlString: string, options: Object, errorCallback: (error: any, data: any) => void): saxjs.parser;
	export function parseString(xmlString: string, errorCallback: (error: any, data: any) => void): saxjs.parser;

	interface IParserOptions {
		attrkey?: string
		charkey?: string
		explicitCharkey?: boolean
		trim?: boolean
		normalizeTags?: boolean
		normalize?: boolean
		explicitRoot?: boolean
		emptyTag?: Object
		explicitArray?: boolean
		ignoreAttrs?: boolean
		mergeAttrs?: boolean
		validator?: Function
		xmlns?: boolean
		explicitChildren?: boolean
		childkey?: string
		charsAsChildren?: boolean
		async?: boolean
		strict?: boolean
	}

	export class Parser {
		constructor(opts?: IParserOptions);
		reset: () => any;
		parseString: (xmlString: string, callback: (error: any, data: any) => void) => saxjs.parser;
	}
}