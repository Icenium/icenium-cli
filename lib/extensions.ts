///<reference path=".d.ts"/>

"use strict";

interface String {
	startsWith(prefix: string): boolean;
	endsWith(prefix: string): boolean;
	isEmpty(): boolean;
}

interface Array {
	contains(element: any): boolean;
}

interface Function {
	$inject: {
		args: string[];
		name: string;
	};
}

function startsWith(prefix) {
	if (typeof prefix !== "string") {
		throw new Error("prefix must be string");
	}

	return this.length >= prefix.length ? this.substr(0, prefix.length) === prefix : false;
}

function endsWith(suffix) {
	if (typeof suffix !== "string") {
		throw new Error("prefix must be string");
	}

	return this.length >= suffix.length ? this.substr(this.length - suffix.length, suffix.length) === suffix : false;
}

function isEmpty() {
	return this === "";
}

String.prototype.startsWith = startsWith;
String.prototype.endsWith = endsWith;
String.prototype.isEmpty = isEmpty;

Array.prototype.contains = function contains(object) {
	return this.indexOf(object) >= 0;
};

(<any>RegExp).escape = function(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
