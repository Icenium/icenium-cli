///<reference path=".d.ts"/>
"use strict";

var ProjectTypes = {
	1: "Cordova",
	"Cordova": 1,

	2: "NativeScript",
	"NativeScript": 2,

	4: "Common",
	"Common" : 4
};

export = ProjectTypes;
$injector.register("projectTypes", ProjectTypes);
