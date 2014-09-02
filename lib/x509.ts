///<reference path=".d.ts"/>
"use strict";

import moment = require("moment");

class X509Certificate implements IX509Certificate {
	private x509: any;

	constructor(private $logger: ILogger) {}

	public load(certificatePem: string): void {
		var jsrsasign = require("../vendor/jsrsasign");
		this.x509 = new jsrsasign.x509();
		this.x509.readCertPEM(certificatePem);
	}

	public get issuerData(): any {
		return X509Certificate.parseKeyValues(this.x509.getIssuerString());
	}

	public get issuedOn(): Date {
		var notBefore = this.x509.getNotBefore();
		return this.toDate(notBefore);
	}

	public get expiresOn(): Date {
		var notAfter = this.x509.getNotAfter();
		return this.toDate(notAfter);
	}

	private toDate(certificateDate: string): Date {
		var timezone = certificateDate.slice(-1);
		if (timezone !== "Z") {
			this.$logger.warn("Certificate time zone is not GMT.");
		}

		return moment(certificateDate, "YYMMDDHHmmss").toDate();
	}

	private static parseKeyValues(keyValueStr: string): any {
		var result = {};
		var keyValues = keyValueStr.split("/");
		keyValues.forEach((kv) => {
			var keyAndValue = kv.split("=");
			if (keyAndValue.length >= 1) {
				result[keyAndValue[0]] = keyAndValue[1];
			}
		});
		return result;
	}
}

export class X509CertificateLoader implements IX509CertificateLoader {
	constructor(private $injector: IInjector) {}

	load(certificatePem:string):IX509Certificate {
		var cert: X509Certificate = this.$injector.resolve(X509Certificate);
		cert.load(certificatePem);
		return cert;
	}
}
$injector.register("x509", X509CertificateLoader);
