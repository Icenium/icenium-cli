///<reference path="../.d.ts"/>

"use strict";

function ValidationResult(error, isSuccessful?) {
	var _isSuccessful = isSuccessful === undefined ? false : true;
	var _error = error;

	if(error === null) {
		_isSuccessful = true;
	}

	Object.defineProperty(this, "Error", {
		get: function() {
			return _error;
		},
		set: function(value) {
			_error = value;
		}
	});

	Object.defineProperty(this, "IsSuccessful", {
		get: function() {
			return _isSuccessful;
		},
		set: function(value) {
			_isSuccessful = value;
		}
	});
}

export = ValidationResult;
