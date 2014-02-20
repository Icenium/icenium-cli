///<reference path="../.d.ts"/>
"use strict";

import validator = require("validator");
import _ = require("underscore");
import helpers = require("../helpers");
import ValidationResult = require("./validation-result");
import BaseValidators = require("./base-validators");
import util = require("util");
import path = require("path");

export class SelfSignedIdentityValidator extends BaseValidators.BaseValidator<ISelfSignedIdentityModel> {
	public static DATE_FORMAT = "YYYY-MM-DD";
	public static GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE = new Date("2033-09-23");

	public static EMPTY_FIELD_ERROR_MESSAGE_PATTERN = "%s is required";
	public static INVALID_FIELD_ERROR_MESSAGE_PATTERN = "%s is invalid";
	public static NEGATIVE_EXPIRATION_ERROR_MESSAGE = "The expiration date must be before the creation date";
	public static INVALID_GOOGLE_PLAY_IDENTITY_EXPIRATION_DATE_ERROR_MESSAGE =
		util.format("The expiration date of google play identity must be after %s", SelfSignedIdentityValidator.GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE);

	public validate(identityModel: ISelfSignedIdentityModel): IValidationResult {
		var validationResult = BaseValidators.Helpers.validate([
				() => this.validateName(identityModel.Name),
				() => this.validateEmail(identityModel.Email),
				() => this.validateCountry(identityModel.Country),
				() => this.validateForGooglePlayPublishing(identityModel.ForGooglePlayPublishing),
				() => this.validateStartDate(identityModel.StartDate),
				() => this.validateEndDate(identityModel.ForGooglePlayPublishing, identityModel.StartDate, identityModel.EndDate)
			]);

		return validationResult;
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
		if(helpers.isNullOrWhitespace(name)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Name"));
		}
		return ValidationResult.ValidationResult.Successful;
	}

	private validateEmail(email: string): IValidationResult {
		if(helpers.isNullOrWhitespace(email)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Email"));
		}
		if (!validator.isEmail(email)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, "Email"));
		}
		return ValidationResult.ValidationResult.Successful;
	}

	private validateCountry(country: string): IValidationResult {
		if(helpers.isNullOrWhitespace(country)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		}
		if (_.contains(helpers.getCountries(), country)) {
			return ValidationResult.ValidationResult.Successful;
		} else {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, "Country"));
		}
	}

	private validateForGooglePlayPublishing(forGooglePlayPublishing: string): IValidationResult {
		if (helpers.isNullOrWhitespace(forGooglePlayPublishing)) {
			return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.EMPTY_FIELD_ERROR_MESSAGE_PATTERN, "For Google Play Publishing"));
		}
		if ("true".equals(forGooglePlayPublishing, false) ||
			"false".equals(forGooglePlayPublishing, false)) {
			return ValidationResult.ValidationResult.Successful;
		}
		return new ValidationResult.ValidationResult(util.format(SelfSignedIdentityValidator.INVALID_FIELD_ERROR_MESSAGE_PATTERN, "For Google Play Publishing"));
	}

	private validateStartDate(startDate: string): IValidationResult {
		var validationResult: IValidationResult = this.validateDate(startDate, "StartDate");
		return validationResult;
	}

	private validateEndDate(forGooglePlayPublishing: string, startDate: string, endDate: string): IValidationResult {
		var parsedStartDate: Date = new Date(startDate);
		var parsedEndDate: Date;

		var validationResult: IValidationResult = this.validateDate(endDate, "EndDate");
		if (!validationResult.IsSuccessful) {
			return validationResult;
		}

		parsedEndDate = new Date(endDate);
		validationResult = this.validateExpiration(forGooglePlayPublishing, parsedStartDate, parsedEndDate);
		return validationResult;
	}

	private validateDate(date: string, fieldName: string): IValidationResult {
		if(helpers.isNullOrWhitespace(date)) {
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

		if ("true".equals(forGooglePlayPublishing, false) &&
			endDate < SelfSignedIdentityValidator.GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE) {
			return new ValidationResult.ValidationResult(SelfSignedIdentityValidator.INVALID_GOOGLE_PLAY_IDENTITY_EXPIRATION_DATE_ERROR_MESSAGE);
		}
		return ValidationResult.ValidationResult.Successful;
	}
}
$injector.register("selfSignedIdentityValidator", SelfSignedIdentityValidator);

export class ImportCryptographicIdentityValidator extends BaseValidators.BaseAsyncValidator<any> {
	public static ALLOWED_IDENTITY_FILES = [".p12"];
	public static INVALID_CRYPTOGRAPHIC_IDENTITY_FILE_EXTENSION_ERROR_MESSAGE =
		"To add a cryptographic identity to the list, import a P12 file that contains an existing cryptographic identity";
	public static NOT_AVAILABLE_CRYPTOGRAPHIC_IDENTITY_FILE_ERROR_MESSAGE_PATTERN =
		"The cryptographic identity file %s does not exist";
	public static EMPTY_PASSWORD_ERROR_MESSAGE = "The password is required";

	constructor(private $fs: IFileSystem){
		super();
	}

	public validate(data: any): IFuture<IValidationResult> {
		return (() => {
			var validationResult = this.validateCertificationFile(data.CertificateFile).wait();
			if (!validationResult.IsSuccessful) {
				return validationResult;
			}
			return this.validatePassword(data.Password);
		}).future<IValidationResult>()();
	}

	public validateProperty(data: any, propertyName: string): IFuture<IValidationResult> {
		return (() => {
			switch(propertyName) {
				case "CertificationFile":
					return this.validateCertificationFile(data.CertificateFile).wait();
				case "Password":
					return this.validatePassword(data.Password);
				default:
					return ValidationResult.ValidationResult.Successful;
			}
		}).future<IValidationResult>()();
	}

	private validateCertificationFile(certificationFile: string): IFuture<IValidationResult> {
		return (() => {
			if (!_.contains(ImportCryptographicIdentityValidator.ALLOWED_IDENTITY_FILES, path.extname(certificationFile))) {
				return new ValidationResult.ValidationResult(ImportCryptographicIdentityValidator.INVALID_CRYPTOGRAPHIC_IDENTITY_FILE_EXTENSION_ERROR_MESSAGE);
			} else if(!this.$fs.exists(certificationFile).wait()) {
				return new ValidationResult.ValidationResult(
					util.format(ImportCryptographicIdentityValidator.NOT_AVAILABLE_CRYPTOGRAPHIC_IDENTITY_FILE_ERROR_MESSAGE_PATTERN, certificationFile));
			}
			return ValidationResult.ValidationResult.Successful;
		}).future<IValidationResult>()();
	}

	private validatePassword(password: string): IValidationResult {
		if (!password) {
			return new ValidationResult.ValidationResult(ImportCryptographicIdentityValidator.EMPTY_PASSWORD_ERROR_MESSAGE);
		}
		return ValidationResult.ValidationResult.Successful;
	}
}
$injector.register("importCryptographicIdentityValidator", ImportCryptographicIdentityValidator);