///<reference path=".d.ts"/>
"use strict";

export class ProgressIndicator implements IProgressIndicator {
	constructor(private $logger: ILogger) { }

	public showProgressIndicator(future: IFuture<any>, timeout: number, options?: { surpressTrailingNewLine?: boolean }): IFuture<void> {
		return (() => {
			let surpressTrailingNewLine = options && options.surpressTrailingNewLine;
			try {
				while(!future.isResolved()) {
					this.$logger.printMsgWithTimeout(".", timeout).wait();
				}

				// Make sure future is not left behind and prevent "There are outstanding futures." error.
				future.wait();
			} catch (err) {
				this.$logger.out();
				throw err;
			}

			if (!surpressTrailingNewLine) {
				this.$logger.out();
			}
		}).future<void>()();
	}
}
$injector.register("progressIndicator", ProgressIndicator);
