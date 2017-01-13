let clipboard = require("copy-paste");

export class ClipboardService implements IClipboardService {
	public async copy(text: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			clipboard.copy(text, (err: any, result: string) => {
				if (err) {
					reject(err);
					return;
				}

				resolve(result);
			});

		});
	}

	public async paste(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			clipboard.paste((err: any, result: string) => {
				if (err) {
					reject(err);
					return;
				}

				resolve(result);
			});
		});
	}
}

$injector.register("clipboardService", ClipboardService);
