
interface ITempPathOptions {
	prefix?: string;
	suffix?: string;
}

declare module "temp" {
	function track(): void;
	function cleanup(): void;
	function mkdirSync(affixes: string): string;
	function path(options: ITempPathOptions) : string;
}
