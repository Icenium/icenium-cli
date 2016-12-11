import * as path from "path";

export class CordovaResourceLoader implements ICordovaResourceLoader {
	constructor(private $resources: IResourceLoader,
		private $fs: IFileSystem) { }

	public buildCordovaJsFilePath(version: string, platform: string): string {
		return path.join(this.$resources.resolvePath("Cordova"), version, `cordova.${platform.toLowerCase()}.js`);
	}

	public getCordovaMigrationData(): ICordovaJsonData {
		return this.$fs.readJson(path.join(this.$resources.resolvePath("Cordova"), "cordova-migration-data.json"));
	}
}

$injector.register("cordovaResources", CordovaResourceLoader);
