///<reference path=".d.ts"/>
"use strict";
let qrcode = require("qrcode-generator");

export class QrCodeGenerator implements IQrCodeGenerator {
	constructor(private $errors: IErrors,
		private $staticConfig: IStaticConfig) {}

	public generateQrCode(data: string) {
		for (let i = 1; i <= 40; ++i) {
			let qr = qrcode(i, "L");
			try {
				qr.addData(data);
				qr.make();
			} catch (ex) {
				let expected = "code length overflow.";
				if (ex.message && ex.message.substr(0, expected.length) === expected) {
					continue;
				} else {
					throw ex;
				}
			}

			return qr;
		}

		this.$errors.fail("code length overflow.");
	}

	generateDataUri(data: string): string {
		let qr = this.generateQrCode(data);
		let cells = qr.getModuleCount();
		let size = this.$staticConfig.QR_SIZE;
		let cellSize = Math.ceil(size / (cells + 2*4 /* margin */));

		let imgTag = qr.createImgTag(cellSize);
		let dataUri = imgTag.split('src="')[1].split('"')[0];
		return dataUri;
	}
}
$injector.register("qr", QrCodeGenerator);
