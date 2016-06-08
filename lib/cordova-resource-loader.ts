import * as path from "path";

export class CordovaResourceLoader implements ICordovaResourceLoader {
	constructor(private $resources: IResourceLoader) { }

	public buildCordovaJsFilePath(version: string, platform: string): string {
		return path.join(this.$resources.resolvePath("Cordova"), version, `cordova.${platform.toLowerCase()}.js`);
	}
}
$injector.register("cordovaResources", CordovaResourceLoader);
