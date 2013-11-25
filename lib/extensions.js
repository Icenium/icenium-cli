"use strict";

(function() {

	function startsWith(prefix) {
		if (typeof prefix !== "string") {
			throw new Error("prefix must be string");
		}

		return this.length >= prefix.length ? this.substr(0, prefix.length) === prefix : false;
	}

	String.prototype.startsWith = startsWith;

})();
