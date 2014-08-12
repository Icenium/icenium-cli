///<reference path=".d.ts"/>
"use strict";
var qrlib: any = require("../vendor/qrcode");

export class QrCodeGenerator implements IQrCodeGenerator {
	constructor(private $config: IConfiguration,
		private $staticConfig: IStaticConfig) {}

	public generateQrCode(data: string) {
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
		var size = this.$staticConfig.QR_SIZE;
		var cellSize = Math.ceil(size / (cells + 2*4 /* margin */));

		return qr.createDataUri(cellSize);
	}
}
$injector.register("qr", QrCodeGenerator);
