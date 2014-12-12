///<reference path=".d.ts"/>
"use strict";
import Future = require("fibers/future");

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

export function isDotNet40Installed(message: string) : IFuture<boolean> {
	var result = new Future<boolean>();
	var Winreg = require("winreg");
	var regKey = new Winreg({
		hive: Winreg.HKLM,
		key:  '\\Software\\Microsoft\\NET Framework Setup\\NDP\\v4\\Client'
	});
	regKey.get("Version", (err: Error, value: string) => {
		if (err) {
			(<IErrors>$injector.resolve("$errors")).fail({ formatStr: message, suppressCommandHelp: true });
		}
		result.return(true);
	});
	return result;
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
};
