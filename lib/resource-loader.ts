///<reference path=".d.ts"/>
"use strict";

import path = require("path");

class ResourceLoader implements IResourceLoader {
	constructor(private $fs: IFileSystem) {}

	resolvePath(resourcePath: string): string {
		return path.join(__dirname, "../resources", resourcePath);
	}

	openFile(resourcePath: string): any {
		return this.$fs.createReadStream(this.resolvePath(resourcePath));
	}
}
$injector.register("resources", ResourceLoader);
