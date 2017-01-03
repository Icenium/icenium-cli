import ValidationResult = require("../common/validators/validation-result");
import BaseValidators = require("./base-validators");
import * as helpers from "../helpers";
import * as util from "util";

export class IOSDeploymentValidator extends BaseValidators.BaseAsyncValidator<IiOSDeploymentValidatorModel> {
	private static NOT_SPECIFIED_PROVISION_ERROR_MESSAGE = "Please specify the provisioning profile (with option --provision) that should be used when building the project.";
	private static NOT_FOUND_PROVISION_ERROR_MESSAGE = "Could not find provision by specified index or name. List registered provisions with 'provision' command";
	private static EXPIRED_PROVISON_ERROR_MESSAGE = "Provisioning profile is expired.";
	private static APPLICATION_IDENTIFIER_MISMATCH = "The application identifier must match the bundle identifier in the provisioning profile.";
	private static NOT_SPECIFIED_CERTIFICATE_ERROR_MESSAGE = "Please specify the certificate (with option --certificate) that should be used when building the project.";
	private static NOT_FOUND_CERTIFICATE_ERROR_MESSAGE = "Could not find certificate by specified index or name. List registered certificates  with 'certificate' command";
	private static EXPIRED_CERTIFICATE_ERROR_MESSAGE = "Certificate is expired.";

	constructor(private appIdentifier: string,
		private deviceIdentifier: string,
		private $identityManager: Server.IIdentityManager,
		private $x509: IX509CertificateLoader,
		$injector: IInjector) {
		super($injector);
	}

	public async validate(model: IiOSDeploymentValidatorModel): Promise<IValidationResult> {
		if (!model.provisionOption) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIED_PROVISION_ERROR_MESSAGE);
		}

		if (!model.certificateOption) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIED_CERTIFICATE_ERROR_MESSAGE);
		}

		let provision = await this.$identityManager.findProvision(model.provisionOption);
		let provisionValidationResult = this.validateProvision(provision);

		if (!provisionValidationResult.isSuccessful) {
			return provisionValidationResult;
		}

		let certificate = await this.$identityManager.findCertificate(model.certificateOption);
		let certificateValidationResult = await this.validateCertificate(certificate, provision);

		if (!certificateValidationResult.isSuccessful) {
			return certificateValidationResult;
		}

		return new ValidationResult.ValidationResult(null);
	}

	public validateProvision(provision: IProvision): IValidationResult {
		if (!provision) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_PROVISION_ERROR_MESSAGE);
		}
		if (Date.parse(provision.ExpirationDate) < new Date().getTime()) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.EXPIRED_PROVISON_ERROR_MESSAGE);
		}
		if (provision.ApplicationIdentifier !== "*") {
			let provisionIdentifierPattern = new RegExp(this.getRegexPattern(provision.ApplicationIdentifier));
			if (!provisionIdentifierPattern.test(this.appIdentifier)) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.APPLICATION_IDENTIFIER_MISMATCH);
			}
		}

		if (this.deviceIdentifier) {
			let isInProvisionedDevices = provision.ProvisionedDevices && _.includes(provision.ProvisionedDevices, this.deviceIdentifier);
			if (!isInProvisionedDevices) {
				return new ValidationResult.ValidationResult(util.format("The device with identifier '%s' is not included in provisioned devices for given provision. Use `$ appbuilder provision -v` to list all devices included in provision", this.deviceIdentifier));
			}
		}

		return new ValidationResult.ValidationResult(null);
	}

	public validateCertificate(certificate: ICryptographicIdentity, provision: IProvision): IValidationResult {
		if (!certificate) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_CERTIFICATE_ERROR_MESSAGE);
		}

		if (!this.$identityManager.isCertificateCompatibleWithProvision(certificate, provision)) {
			return new ValidationResult.ValidationResult("Certificate is not included in provision's certificates");
		}

		if (this.isCertificateExpired(certificate.Certificate)) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.EXPIRED_CERTIFICATE_ERROR_MESSAGE);
		}

		return new ValidationResult.ValidationResult(null);
	}

	private isCertificateExpired(certificate: string): boolean {
		let cert = this.$x509.load(certificate);
		return cert.expiresOn <= new Date();
	}

	private getRegexPattern(appIdentifier: string): string {
		let starPlaceholder = "<!StarPlaceholder!>";
		let escapedIdentifier = this.escape(helpers.stringReplaceAll(appIdentifier, "*", starPlaceholder));
		let replacedIdentifier = helpers.stringReplaceAll(escapedIdentifier, starPlaceholder, ".*");
		return "^" + replacedIdentifier + "$";
	}

	private escape(s: string): string {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}
}
$injector.register("iOSDeploymentValidator", IOSDeploymentValidator);
