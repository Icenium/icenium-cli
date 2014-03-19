///<reference path="../.d.ts"/>

import path = require("path");
import helpers = require("../helpers");
import ValidationResult = require("./validation-result");

export class ProjectNameValidator {
	private static MAX_FILENAME_LENGTH = 30;
	private static EMPTY_FILENAME_ERROR_MESSAGE = "Name cannot be empty.";
	private static NOT_VALID_NAME_ERROR_MESSAGE = "Name should contain only the following symbols: A-Z, a-z, 0-9, _, ., +, -, @, $, &, ;, (, ), space, and comma.";
	private static RESERVED_NAME_ERROR_MESSAGE = "Name is among the reserved names: CON, PRN, AUX, NUL, COM1, COM2, COM3, COM4, COM5, COM6, COM7, COM8, COM9, LPT1, LPT2, LPT3, LPT4, LPT5, LPT6, LPT7, LPT8, and LPT9.";
	private static INVALID_EXTENSION_ERROR_MESSAGE = "Unsupported file type.";
	private static TOO_LONG_NAME_ERROR_MESSAGE = "Name is too long.";
	private static TRAILING_DOTS_ERROR_MESSAGE = "Name cannot contain trailing dots.";
	private static LEADING_SPACES_ERROR_MESSAGE = "Name cannot contain leading spaces.";
	private static TRAILING_SPACES_ERROR_MESSAGE = "Name cannot contain trailing spaces.";
	private static INVALID_FILENAMES = [ "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
	private static INVALID_EXTENSIONS = [];

	private validateName(name: string): ValidationResult.ValidationResult {
		var validNameRegex = new RegExp("^[a-zA-Z0-9_.+\\-@$&;() ,]*$");
		var ext = path.extname(name);

		if(helpers.isNullOrWhitespace(name)) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.EMPTY_FILENAME_ERROR_MESSAGE);
		}
		if(!validNameRegex.test(name)) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.NOT_VALID_NAME_ERROR_MESSAGE);
		}
		if(_.contains(ProjectNameValidator.INVALID_FILENAMES, name.split(".")[0])) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.RESERVED_NAME_ERROR_MESSAGE);
		}
		if(ext !== "" && _.contains(ProjectNameValidator.INVALID_EXTENSIONS, ext)) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.INVALID_EXTENSION_ERROR_MESSAGE);
		}
		if(name.length > ProjectNameValidator.MAX_FILENAME_LENGTH) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.TOO_LONG_NAME_ERROR_MESSAGE);
		}
		if(name.startsWith(" ")) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.LEADING_SPACES_ERROR_MESSAGE);
		}
		if(name.endsWith(".")) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.TRAILING_DOTS_ERROR_MESSAGE);
		}
		if(name.endsWith((" "))) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.TRAILING_SPACES_ERROR_MESSAGE);
		}

		return new ValidationResult.ValidationResult(null);
	}

	public validate(name: string): boolean {
		var validationResult: ValidationResult.ValidationResult = this.validateName(name);
		var isSuccessful = validationResult.IsSuccessful;

		if(!isSuccessful) {
			throw new Error(validationResult.Error);
		}

		return isSuccessful;
	}
}
$injector.register("projectNameValidator", ProjectNameValidator);