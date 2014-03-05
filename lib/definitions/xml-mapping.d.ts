declare module "xml-mapping" {
	export function tojson(xml: string, options?: Object): Object;
	export function toxml(json: Object, options?: Object): string;
}
