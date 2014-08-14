///<reference path=".d.ts"/>
"use strict";

export function isWindows() {
	return process.platform === "win32";
}

export function isWindows64() {
	return isWindows() && (process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432"));
}

export function isWindows32() {
	return isWindows() && !isWindows64();
}

export function isDarwin() {
	return process.platform.toUpperCase() === "DARWIN";
}

export function isLinux() {
	return process.platform === "linux";
}

export var hostCapabilities: { [key:string]: IHostCapabilities } = {
	"win32": { 
		debugToolsSupported: true
	},
	"darwin": {
		debugToolsSupported: true
	},
	"linux": {
		debugToolsSupported: false
	}
}

export function getUserHomeDir(): string {
	return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE; // works on mac/win. not tested on linux
}
