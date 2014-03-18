///<reference path=".d.ts"/>

var qrlib: any = require("../vendor/qrcode");

"use strict";

export class QrCodeGenerator implements IQrCodeGenerator {
	constructor(private $config: IConfiguration) {}

	public generateQrCode(data) {
		for (var i = 1; i <= 10; ++i) {
			var qr = qrlib(i, "L");
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
		throw new Error("code length overflow.");
	}

	generateDataUri(data: string): string {
		var qr = this.generateQrCode(data);
		var cells = qr.getModuleCount();
		var size = this.$config.QR_SIZE;
		var cellSize = Math.ceil(size / (cells + 2*4 /* margin */));

		return qr.createDataUri(cellSize);
	}
}
$injector.register("qr", QrCodeGenerator);
