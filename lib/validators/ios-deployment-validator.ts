///<reference path="../.d.ts"/>

"use strict";

import ValidationResult = require("./validation-result");
import BaseValidators = require("./base-validators");
import Future = require("fibers/future");
import helpers = require("./../helpers");
import util = require("util");

export class IOSDeploymentValidator extends BaseValidators.BaseAsyncValidator<IiOSDeploymentValidatorModel> {
	private static NOT_SPECIFIED_PROVISION_ERROR_MESSAGE = "Please specify the provisioning profile (with option --provision) that should be used when building the project.";
	private static NOT_FOUND_PROVISION_ERROR_MESSAGE = "Could not find provision by specified index or name. List registered provisions with 'list-provisions' command";
	private static EXPIRED_PROVISON_ERROR_MESSAGE = "Provisioning profile is expired.";
	private static APPLICATION_IDENTIFIER_MISMATCH = "The application identifier must match the bundle identifier in the provisioning profile.";
	private static NOT_SPECIFIED_CERTIFICATE_ERROR_MESSAGE = "Please specify the certificate (with option --certificate) that should be used when building the project.";
	private static NOT_FOUND_CERTIFICATE_ERROR_MESSAGE = "Could not find certificate by specified index or name. List registered certificates  with 'list-certificates' command";
	private static EXPIRED_CERTIFICATE_ERROR_MESSAGE = "Certificate is expired.";

	constructor(private appIdentifier: string,
		private deviceIdentifier: string,
		private $identityManager: Server.IIdentityManager,
		private $logger: ILogger,
		private $x509: IX509CertificateLoader) {
		super();
	}

	public validate(model: IiOSDeploymentValidatorModel): IFuture<IValidationResult> {
		return (() => {
			if(!model.provisionOption) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIED_PROVISION_ERROR_MESSAGE);
			}

			if(!model.certificateOption) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIED_CERTIFICATE_ERROR_MESSAGE);
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

	public validateProvision(provision: IProvision):IValidationResult {
		if(!provision) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_PROVISION_ERROR_MESSAGE);
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

		if(this.deviceIdentifier) {
			var isInProvisionedDevices = provision.ProvisionedDevices && _.contains(provision.ProvisionedDevices, this.deviceIdentifier);
			if(!isInProvisionedDevices) {
				return new ValidationResult.ValidationResult(util.format("The device with identifier '%s' is not included in provisioned devices for given provision. Use `$ appbuilder list-provisions -v` to list all devices included in provision", this.deviceIdentifier));
			}
		}

		return new ValidationResult.ValidationResult(null);
	}

	public validateCertificate(certificate: ICryptographicIdentity, provision: IProvision): IFuture<IValidationResult> {
		return(() => {
			if(!certificate) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_CERTIFICATE_ERROR_MESSAGE);
			}

			if(!this.$identityManager.isCertificateCompatibleWithProvision(certificate, provision)) {
				return new ValidationResult.ValidationResult("Certificate is not included in provision's certificates");
			}

			if(this.isCertificateExpired(certificate.Certificate)) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.EXPIRED_CERTIFICATE_ERROR_MESSAGE);
			}

			return new ValidationResult.ValidationResult(null);
		}).future<IValidationResult>()();
	}

	private isCertificateExpired(certificate: string): boolean {
		var cert = this.$x509.load(certificate);
		return cert.expiresOn <= new Date();
	}

	private getRegexPattern(appIdentifier): string {
		var starPlaceholder = "<!StarPlaceholder!>";
		var escapedIdentifier = (<any>RegExp).escape(helpers.stringReplaceAll(appIdentifier, "*", starPlaceholder));
		var replacedIdentifier = helpers.stringReplaceAll(escapedIdentifier, starPlaceholder, ".*");
		return "^" + replacedIdentifier + "$";
	}
}
$injector.register("iOSDeploymentValidator", IOSDeploymentValidator);

