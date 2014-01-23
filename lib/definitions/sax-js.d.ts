
declare module "saxjs" {
	export class parser {
		comment: string;
		sgmlDecl: string;
		textNode: string;
		tagName: string;
		doctype: string;
		procInstName: string;
		procInstBody: string;
		entity: string;
		attribName: string;
		attribValue: string;
		cdata: string;
		script: string;

		c: string;
		q: string;

		bufferCheckPosition: number;
		opt: {
			trim: boolean;
			normalize: boolean;
			xmlns: boolean;
			lowercase: any;
		}
		looseCase: string;
		tags: any[];
		sawRoot: boolean;
		closedRoot: boolean;
		closed: boolean;
		error: any;
		tag: {
			name: string;
			attributes: Object;
			isSelfClosing: boolean;
		}
		strict: boolean;
		noscript: boolean;
		state: number;
		ENTITIES: Object;
		attribList: any[];
		trackPosition: boolean;
		column: number;
		line: number;
		position: number;

		onerror: (e) => any;
		onopentag: (node) => any;
		onclosetag: Function;
		ontext: (t) => any;
		oncdata: Function;

		startTagPosition: number;

		end: Function;
		write: Function;
		resume: Function;
		close: Function;
	}
}