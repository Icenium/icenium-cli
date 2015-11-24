declare module "plugman" {
	function config(params: string[], callback: (error: Error, result: any) => void): void;
	function fetch(plugin_dir:string, plugins_dir:string, link:boolean, subdir:string, git_ref:string, callback: (error: Error, result: any) => void): void;
	function search(keywords: string[], callback: (error: Error, result: any) => void): void;
}