///<reference path="../.d.ts"/>
"use strict";

export enum DevicePlatforms {
	iOS,
	Android
}

export class LocalToDevicePathData implements Mobile.ILocalToDevicePathData {

	constructor(private localPath: string, private devicePath: string, private relativeToProjectBasePath: string) {

	}

	getLocalPath(): string { return this.localPath; }
	getDevicePath(): string { return this.devicePath; }
	getRelativeToProjectBasePath(): string { return this.relativeToProjectBasePath; }
}