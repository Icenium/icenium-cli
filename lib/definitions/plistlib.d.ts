declare module "plistlib" {
	export function toString(data: any): string;
}

declare module "plist-parser" {
	export var PlistParser: {
		new (data: string);
		parse(): any;
	};
}