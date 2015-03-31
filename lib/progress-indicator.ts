///<reference path=".d.ts"/>
"use strict";

export class ProgressIndicator implements IProgressIndicator {
	constructor(private $logger: ILogger) { }

	public showProgressIndicator(future: IFuture<any>, timeout: number): IFuture<void> {
		return (() => {
			while(!future.isResolved()) {
				this.$logger.printMsgWithTimeout(".", timeout).wait();
			}
			// Make sure future is not left behind and prevent "There are outstanding futures." error.
			future.wait();
		}).future<void>()();
	}
}
$injector.register("progressIndicator", ProgressIndicator);