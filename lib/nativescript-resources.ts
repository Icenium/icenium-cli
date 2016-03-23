///<reference path=".d.ts"/>
"use strict";

import * as path from "path";

export class NativeScriptResources implements INativeScriptResources {
	private _nativeScriptResourcesDir: string;
	private _nativeScriptDefaultPackageJsonFile: string;
	private _nativeScriptMigrationFile: string;

	constructor(private $projectConstants: Project.IConstants,
		private $resources: IResourceLoader) {}

	public get nativeScriptResourcesDir(): string {
		if(!this._nativeScriptResourcesDir) {
			this._nativeScriptResourcesDir = this.$resources.resolvePath("NativeScript");
		}

		return this._nativeScriptResourcesDir;
	}

	public get nativeScriptMigrationFile(): string {
		if(!this._nativeScriptMigrationFile) {
			this._nativeScriptMigrationFile = path.join(this.nativeScriptResourcesDir, "nativeScript-migration-data.json");
		}

		return this._nativeScriptMigrationFile;
	}

	public get nativeScriptDefaultPackageJsonFile(): string {
		if(!this._nativeScriptDefaultPackageJsonFile) {
			this._nativeScriptDefaultPackageJsonFile = path.join(this.nativeScriptResourcesDir, this.$projectConstants.PACKAGE_JSON_NAME);
		}

		return this._nativeScriptDefaultPackageJsonFile;
	}
}
$injector.register("nativeScriptResources", NativeScriptResources);
