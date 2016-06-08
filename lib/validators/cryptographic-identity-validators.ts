import validator = require("validator");
import commonHelpers = require("../common/helpers");
import helpers = require("../helpers");
import ValidationResult = require("../common/validators/validation-result");
import BaseValidators = require("./base-validators");
import * as util from "util";

export class SelfSignedIdentityValidator extends BaseValidators.BaseValidator<ISelfSignedIdentityModel> {
	public static DATE_FORMAT = "YYYY-MM-DD";
	public static GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE = new Date(2033, 9, 23, 0, 0, 0, 0);

	public static EMPTY_FIELD_ERROR_MESSAGE_PATTERN = "%s is required";
	public static INVALID_FIELD_ERROR_MESSAGE_PATTERN = "%s is invalid";
	public static NEGATIVE_EXPIRATION_ERROR_MESSAGE = "The expiration date must be before the creation date";
	public static INVALID_GOOGLE_PLAY_IDENTITY_EXPIRATION_DATE_ERROR_MESSAGE =
		util.format("The expiration date of google play identity must be after %s", SelfSignedIdentityValidator.GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE);

	constructor(private $x509: IX509CertificateLoader,
		$injector: IInjector) {
		super($injector);
	}

	public validate(identityModel: ISelfSignedIdentityModel): IValidationResult {
		let validationResult = BaseValidators.Helpers.validate([
				() => this.validateName(identityModel.Name),
				() => this.validateEmail(identityModel.Email),
				() => this.validateCountry(identityModel.Country),
				() => this.validateForGooglePlayPublishing(identityModel.ForGooglePlayPublishing),
				() => this.validateStartDate(identityModel.StartDate),
				() => this.validateEndDate(identityModel.ForGooglePlayPublishing, identityModel.StartDate, identityModel.EndDate)
			]);

		return validationResult;
	}

	public validateCertificate(forGooglePlayPublishing: boolean, certificatePem: string): boolean {
		let cert = this.$x509.load(certificatePem);
		return this.validateStartDate(cert.issuedOn.toString()).isSuccessful
			&& this.validateEndDate(forGooglePlayPublishing.toString(), cert.issuedOn.toString(), cert.expiresOn.toString()).isSuccessful;
	}

	public validateProperty(identityModel: ISelfSignedIdentityModel, propertyName: string): IValidationResult {
		switch(propertyName) {
			case "Name":
				return this.validateName(identityModel.Name);
			case "Email":
				return this.validateEmail(identityModel.Email);
			case "Country":
				return this.validateCountry(identityModel.Country);
			case "ForGooglePlayPublishing":
				return this.validateForGooglePlayPublishing(identityModel.ForGooglePlayPublishing);
			case "StartDate":
				return this.validateStartDate(identityModel.StartDate);
			case "EndDate":
				return this.validateEndDate(identityModel.ForGooglePlayPublishing, identityModel.StartDate, identityModel.EndDate);
			default:
				return ValidationResult.ValidationResult.Successful;
		}
	}

	private validateName(name: string): IValidationResult {
		if(commonHelpers.isNullOrWhitespace(name)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Name"));
		}
		return ValidationResult.ValidationResult.Successful;
	}

	private validateEmail(email: string): IValidationResult {
		if(commonHelpers.isNullOrWhitespace(email)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Email"));
		}
		if (!validator.isEmail(email)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, "Email"));
		}
		return ValidationResult.ValidationResult.Successful;
	}

	private validateCountry(country: string): IValidationResult {
		if(commonHelpers.isNullOrWhitespace(country)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		}
		if (_.contains(helpers.getCountries(), country)) {
			return ValidationResult.ValidationResult.Successful;
		} else {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		}
	}

	private validateForGooglePlayPublishing(forGooglePlayPublishing: string): IValidationResult {
		if (commonHelpers.isNullOrWhitespace(forGooglePlayPublishing)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "For Google Play Publishing"));
		}
		if(forGooglePlayPublishing.toLowerCase() === "true" || forGooglePlayPublishing.toLowerCase() === "false") {
			return ValidationResult.ValidationResult.Successful;
		}
		return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, "For Google Play Publishing"));
	}

	private validateStartDate(startDate: string): IValidationResult {
		let validationResult: IValidationResult = this.validateDate(startDate, "StartDate");
		return validationResult;
	}

	private validateEndDate(forGooglePlayPublishing: string, startDate: string, endDate: string): IValidationResult {
		let parsedStartDate: Date = new Date(startDate);
		let parsedEndDate: Date;

		let validationResult: IValidationResult = this.validateDate(endDate, "EndDate");
		if (!validationResult.isSuccessful) {
			return validationResult;
		}

		parsedEndDate = new Date(endDate);
		validationResult = this.validateExpiration(forGooglePlayPublishing, parsedStartDate, parsedEndDate);
		return validationResult;
	}

	private validateDate(date: string, fieldName: string): IValidationResult {
		if(commonHelpers.isNullOrWhitespace(date)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, fieldName));
		}
		if (!validator.isDate(date)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, fieldName));
		}
		return ValidationResult.ValidationResult.Successful;
	}

	private validateExpiration(forGooglePlayPublishing: string, startDate: Date, endDate: Date): IValidationResult {
		if (startDate > endDate) {
			return new ValidationResult.ValidationResult(SelfSignedIdentityValidator.NEGATIVE_EXPIRATION_ERROR_MESSAGE);
		}

		if(forGooglePlayPublishing.toLowerCase() === "true" &&
			endDate < SelfSignedIdentityValidator.GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE) {
			return new ValidationResult.ValidationResult(SelfSignedIdentityValidator.INVALID_GOOGLE_PLAY_IDENTITY_EXPIRATION_DATE_ERROR_MESSAGE);
		}
		return ValidationResult.ValidationResult.Successful;
	}
}
$injector.register("selfSignedIdentityValidator", SelfSignedIdentityValidator);
