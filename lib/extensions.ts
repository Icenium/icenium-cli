///<reference path=".d.ts"/>

"use strict";

interface String {
	startsWith(prefix: string): boolean;
	endsWith(prefix: string): boolean;
	isEmpty(): boolean;
	equals(value: string, caseSensitive: boolean): boolean;
}

interface Function {
	$inject: {
		args: string[];
		name: string;
	};
}

interface Error {
	stack: string;
}

function startsWith(prefix) {
	if (typeof prefix !== "string") {
		throw new Error("prefix must be string");
	}

	return this.length >= prefix.length ? this.substr(0, prefix.length) === prefix : false;
}

function endsWith(suffix) {
	if (typeof suffix !== "string") {
		throw new Error("suffix must be string");
	}

	return this.length >= suffix.length ? this.substr(this.length - suffix.length, suffix.length) === suffix : false;
}

function isEmpty() {
	return this === "";
}

function equals(value: string, caseSensitive: boolean): boolean {
	if (typeof value !== "string") {
		throw new Error("value must be string");
	}

	if (caseSensitive) {
		return this === value;
	}
	return this.toLowerCase() === value.toLowerCase();
}

String.prototype.startsWith = startsWith;
String.prototype.endsWith = endsWith;
String.prototype.isEmpty = isEmpty;
String.prototype.equals = equals;

(<any>RegExp).escape = function(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
