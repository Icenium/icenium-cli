///<reference path="../.d.ts"/>

"use strict";

import ValidationResult = require("./validation-result");
import BaseValidators = require("./base-validators");
import Future = require("fibers/future");
import helpers = require("./../helpers");
import util = require("util");
import _ = require("underscore");
import moment = require("moment");

export class IOSDeploymentValidator extends BaseValidators.BaseAsyncValidator<IiOSDeploymentValidatorModel> {
	private static NOT_SPECIFIER_PROVISION_ERROR_MESSAGE = "Please specify the provisioning profile (with option --provision) that should be used when building the project.";
	private static MISSING_PROVISION_ERROR_MESSAGE = "No provisioning profile found.";
	private static NOT_FOUND_PROVISION_ERROR_MESSAGE = "Could not find provision with name or starting with name '%s'. List registered provisions with 'list-provisions' command";
	private static EXPIRED_PROVISON_ERROR_MESSAGE = "Provisioning profile is expired.";
	private static APPLICATION_IDENTIFIER_MISMATCH = "The application identifier must match the bundle identifier in the provisioning profile.";
	private static NOT_SPECIFIER_CERTIFICATE_ERROR_MESSAGE = "Please specify the certificate (with option --certificate) that should be used when building the project.";
	private static MISSING_CERTIFICATE_ERROR_MESSAGE = "Certificate is missing.";
	private static NOT_FOUND_CERTIFICATE_ERROR_MESSAGE = "Could not find valid certificates for provision '%s'";
	private static EXPIRED_CERTIFICATE_ERROR_MESSAGE = "Certificate is expired.";

	constructor(private appIdentifier: string,
		private device: Mobile.IDevice,
		private $identityManager: Server.IIdentityManager,
		private $logger: ILogger) {
		super();
	}

	public validate(model: IiOSDeploymentValidatorModel): IFuture<IValidationResult> {
		return (() => {
			if(!model.provisionOption) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIER_PROVISION_ERROR_MESSAGE);
			}

			if(!model.certificateOption) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIER_CERTIFICATE_ERROR_MESSAGE);
			}

			var provision = this.$identityManager.findProvision(model.provisionOption).wait();
			var provisionValidationResult = this.validateProvision(provision);

			if(!provisionValidationResult.IsSuccessful) {
				return provisionValidationResult;
			}

			var certificate = this.$identityManager.findCertificate(model.certificateOption).wait();
			var certificateValidationResult = this.validateCertificate(certificate, provision).wait();

			if(!certificateValidationResult.IsSuccessful) {
				return certificateValidationResult;
			}

			return new ValidationResult.ValidationResult(null);

		}).future<IValidationResult>()();
	}

	private validateProvision(provision: IProvision):IValidationResult {
		if(!provision) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_PROVISION_ERROR_MESSAGE);
		}
		if(provision === null) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.MISSING_PROVISION_ERROR_MESSAGE);
		}
		if(Date.parse(provision.ExpirationDate) < new Date().getTime()) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.EXPIRED_PROVISON_ERROR_MESSAGE);
		}
		if(provision.ApplicationIdentifier !== "*") {
			var provisionIdentifierPattern = new RegExp(this.getRegexPattern(provision.ApplicationIdentifier));
			if(!provisionIdentifierPattern.test(this.appIdentifier)) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.APPLICATION_IDENTIFIER_MISMATCH);
			}
		}

		if(this.device) {
			var isInProvisionedDevices = provision.ProvisionedDevices && provision.ProvisionedDevices.contains(this.device.getIdentifier());
			if(!isInProvisionedDevices) {
				return new ValidationResult.ValidationResult(util.format("The device with identifier '%s' is not included in provisioned devices for given provision. Use $ appbuilder list-provision -v to list all devices included in provision", this.device.getIdentifier()));
			}
		}

		return new ValidationResult.ValidationResult(null);
	}

	private validateCertificate(certificate: ICryptographicIdentity, provision: IProvision): IFuture<IValidationResult> {
		return(() => {
			if(!certificate) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_CERTIFICATE_ERROR_MESSAGE);
			}

			if(certificate === null) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.MISSING_CERTIFICATE_ERROR_MESSAGE);
			}

			var formattedCertificate = helpers.stringReplaceAll(certificate.Certificate, "\r\n", "");

			if(!_.some(provision.Certificates,(c) => { return formattedCertificate.indexOf(c) > 0; })) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.MISSING_CERTIFICATE_ERROR_MESSAGE);
			}

			if(this.isCertificateExpired(certificate.Certificate)) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.EXPIRED_CERTIFICATE_ERROR_MESSAGE);
			}

			return new ValidationResult.ValidationResult(null);
		}).future<IValidationResult>()();
	}

	private isCertificateExpired(certificate: string): boolean {
		var x509lib = require("../../vendor/jsrsasign");
		var x509 = new x509lib.x509();
		x509.readCertPEM(certificate);
		var notAfter = x509.getNotAfter();

		this.$logger.trace("timezone: '%s'", notAfter.slice(-1));

		return moment(notAfter, "YYDDMMHHmmss").toDate() <= new Date();
	}

	private getRegexPattern(appIdentifier) {
		var starPlaceholder = "\<!StarPlaceholder!>";
		var escapedIdentifier = (<any>RegExp).escape(helpers.stringReplaceAll(appIdentifier, "*", starPlaceholder));
		var replacedIdentifier = helpers.stringReplaceAll(escapedIdentifier, starPlaceholder, ".*");
		return "^" + replacedIdentifier + "$";
	}
}
$injector.register("iOSDeploymentValidator", IOSDeploymentValidator);

