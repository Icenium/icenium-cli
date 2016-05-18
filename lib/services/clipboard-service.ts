///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
let clipboard = require("copy-paste");

export class ClipboardService implements IClipboardService {
	public copy(text: string): IFuture<string> {
		let future = new Future<string>();

		clipboard.copy(text, (err: any, result: string) => {
			if (err) {
				future.throw(err);
			}

			future.return(result);
		});

		return future;
	}

	public paste(): IFuture<string> {
		let future = new Future<string>();

		clipboard.paste((err: any, result: string) => {
			if (err) {
				future.throw(err);
			}

			future.return(result);
		});

		return future;
	}
}

$injector.register("clipboardService", ClipboardService);
