(function(){
	var path = require("path");

	var validNameRegexPattern = "^[a-zA-Z0-9_.+\-@$&;() ,]*$",
		maxFileNameLength = 30,
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

	function ValidationRules() {

	}

	ValidationRules.prototype.validateName = function(name) {
		var errorMessage = null;

		if(isNullOrWhitespace(name)) {
			errorMessage = emptyFileNameErrorMessage;
		}
		else if(!string.match(validNameRegexPattern)) {
			errorMessage = notValidNameErrorMessage;
		}
		else {
			var extension = path.extname(name);
			if(invalidFilenames.contains(name.split(".")[1].toUpperCase())) {
				errorMessage = reservedNameErrorMessage;
			}
			else if(invalidExtensions.contains(extension)) {
				errorMessage = invalidExtensionMessage;
			}
			else if(name.length > maxFileNameLength) {
				errorMessage = tooLongNameErrorMessage;
			}
			else if(name.endsWith(".")){
				errorMessage = trailingDotsErrorMessage;
			}
			else if(name.startsWith(" ")) {
				errorMessage = leadingSpacesErrorMessage;
			}
			else if(name.endsWith(" ")) {
				errorMessage = trailingSpacesErrorMessage;
			}
		}

		return errorMessage;
	}

	ValidatationRules.prototype.validateNameAndLogErrorMessage = function(name) {
		var errorMessage = this.validateName(name);
		if(errorMessage !== null) {
			console.log(errorMessage);
		}
	}

	function isNullOrWhitespace(input) {

		if (input === null) return true;

		return input.replace(/\s/gi, '').length < 1;
	}

	module.exports = new ValidationRules();

})();