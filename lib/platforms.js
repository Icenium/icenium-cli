(function() {
	"use strict";

	var platforms = {
		"android": require("./platforms/android"),
		"ios": require("./platforms/ios")
	};

	function get(platform) {
		if (!platform) {
			return platforms;
		}
		else if (isSupported(platform)) {
			return platforms[platform.toLowerCase()];
		}
		return null;
	}

	function isSupported(platform) {
		return !platform ||
			(platform && platforms[platform.toLowerCase()]);
	}

	exports.isSupported = isSupported;
	exports.get = get;
}());