///<reference path=".d.ts"/>
"use strict";

import util = require("util");

var ProjectTypes = {
	0: "Cordova",
	"Cordova": 0,

	1: "NativeScript",
	"NativeScript": 1
}

$injector.register("projectTypes", ProjectTypes);
