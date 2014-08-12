declare module "colors" {
	export function setTheme(theme: any): void;
	export function addSequencer(name: string, callback: Function): void;

	// none, browser, console
	export var mode: string;
}

interface String {
	bold: string;
	italic: string;
	underline: string;
	inverse: string;
	white: string;
	grey: string;
	black: string;
	blue: string;
	cyan: string;
	green: string;
	magenta: string;
	red: string;
	yellow: string;
}
