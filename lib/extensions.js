"use strict";

/* jshint -W040 */ // disable "Possible strict violation" for the entire file.

(function() {

	function startsWith(prefix) {
		if (typeof prefix !== "string") {
			throw new Error("prefix must be string");
		}

		return this.length >= prefix.length ? this.substr(0, prefix.length) === prefix : false;
	}

	function isEmpty() {
		return this === "";
	}

	String.prototype.startsWith = startsWith;
	String.prototype.isEmpty = isEmpty;

	Array.prototype.contains = function(object) {
		return this.indexOf(object) >= 0;
	}
})();
