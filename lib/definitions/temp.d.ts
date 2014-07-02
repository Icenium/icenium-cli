
interface ITempPathOptions {
	prefix?: string;
	suffix?: string;
}

declare module "temp" {
	function track();
	function cleanup();
	function mkdirSync(affixes: string);
	function path(options: ITempPathOptions) : string;
}