declare module "rimraf" {
	function rmdir(path: string, callback: (error: Error) => void);
	function sync(path: string);
	export = rmdir;
}