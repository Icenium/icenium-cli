///<reference path=".d.ts"/>
"use strict";

import util = require("util");

var ProjectTypes = {
	1: "Cordova",
	"Cordova": 1,

	2: "NativeScript",
	"NativeScript": 2,

	4: "Common",
	"Common" : 4
}

$injector.register("projectTypes", ProjectTypes);
