(function(){
	var path = require("path"),
		ValidationResult = require("./validation-result");

	var maxFileNameLength = 30,
		emptyFileNameErrorMessage = "Name cannot be empty.",
		notValidNameErrorMessage = "Name should contain only the following symbols: A-Z, a-z, 0-9, _, ., +, -, @, $, &, ;, (, ), space, and comma.",
		reservedNameErrorMessage = "Name is among the reserved names: CON, PRN, AUX, NUL, COM1, COM2, COM3, COM4, COM5, COM6, COM7, COM8, COM9, LPT1, LPT2, LPT3, LPT4, LPT5, LPT6, LPT7, LPT8, and LPT9.",
		invalidExtensionMessage = "Unsupported file type.",
		tooLongNameErrorMessage = "Name is too long.",
		trailingDotsErrorMessage = "Name cannot contain trailing dots.",
		leadingSpacesErrorMessage = "Name cannot contain leading spaces.",
		trailingSpacesErrorMessage = "Name cannot contain trailing spaces.";

	var invalidFilenames = [ "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"],
		invalidExtensions = [];

	var validNameRegexPattern = "^[a-zA-Z0-9_.+\-@$&;() ,]*$",
		validNameRegex = new RegExp(validNameRegexPattern);

	function ProjectNameValidator() {

	}

	ProjectNameValidator.prototype.validateName = function(name) {
		if(isNullOrWhitespace(name)) {
			return new ValidationResult(emptyFileNameErrorMessage);
		}
		else if(!name.match(validNameRegex)) {
			return new ValidationResult(notValidNameErrorMessage);
		}
		else {
			var extension = path.extname(name);
			if(extension !== "") {
				if(invalidFilenames.contains(name.split(".")[1].toUpperCase())) {
					return new ValidationResult(reservedNameErrorMessage);
				}
				else if(invalidExtensions.contains(extension)) {
					return new ValidationResult(invalidExtensionMessage);
				}
			}
			else if(extension === "") {
				if(invalidFilenames.contains(name)) {
					return new ValidationResult(reservedNameErrorMessage);
				}
			}
			else if(name.length > maxFileNameLength) {
				return new ValidationResult(tooLongNameErrorMessage);
			}
			else if(name.endsWith(".")){
				return new ValidationResult(trailingDotsErrorMessage);
			}
			else if(name.startsWith(" ")) {
				return new ValidationResult(leadingSpacesErrorMessage);
			}
			else if(name.endsWith(" ")) {
				return new ValidationResult(trailingSpacesErrorMessage);
			}
		}

		return new ValidationResult(null);
	};

	ProjectNameValidator.prototype.validateNameAndLogErrorMessage = function(name) {
		var projectNameValidationResult = this.validateName(name);
		if(projectNameValidationResult.Error !== null) {
			throw projectNameValidationResult.Error;
		}
	};

	function isNullOrWhitespace(input) {

		if (input === undefined || input === null)
		{
			return true;
		}

		return input.replace(/\s/gi, '').length < 1;
	}

	module.exports = new ProjectNameValidator();

})();