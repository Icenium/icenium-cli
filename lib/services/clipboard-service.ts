import Future = require("fibers/future");
let clipboard = require("copy-paste");

export class ClipboardService implements IClipboardService {
	public async copy(text: string): Promise<string> {
		let future = new Future<string>();

		clipboard.copy(text, (err: any, result: string) => {
			if (err) {
				future.throw(err);
			}

			future.return(result);
		});

		return future;
	}

	public async paste(): Promise<string> {
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
