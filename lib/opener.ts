///<reference path=".d.ts"/>

"use strict";

import xopen = require("open");

export class Opener implements IOpener {
	
	public open(filename: string): void {
		xopen(filename);
	}
}
$injector.register("opener", Opener);
