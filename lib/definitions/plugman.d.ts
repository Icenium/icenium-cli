declare module "plugman" {
	function config(params: string[], callback: (result: any) => void): void;
	function fetch(plugin_dir:string, plugins_dir:string, link:boolean, subdir:string, git_ref:string, callback: (result: any) => void): void;
	function search(keywords: string[], callback: (result: any) => void): void;
}