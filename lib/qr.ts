///<reference path=".d.ts"/>
"use strict";
var qrcode = require("qrcode-generator");

export class QrCodeGenerator implements IQrCodeGenerator {
	constructor(private $errors: IErrors,
		private $staticConfig: IStaticConfig) {}

	public generateQrCode(data: string) {
		for (var i = 1; i <= 40; ++i) {
			var qr = qrcode(i, "L");
			try {
				qr.addData(data);
				qr.make();
			} catch (ex) {
				var expected = "code length overflow.";
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
		var qr = this.generateQrCode(data);
		var cells = qr.getModuleCount();
		var size = this.$staticConfig.QR_SIZE;
		var cellSize = Math.ceil(size / (cells + 2*4 /* margin */));

		var imgTag = qr.createImgTag(cellSize);
		var dataUri = imgTag.split('src="')[1].split('"')[0];
		return dataUri;
	}
}
$injector.register("qr", QrCodeGenerator);
