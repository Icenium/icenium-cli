"use strict";

(function() {
	var options = require("./options")
		, server = require("./server")
		;

	console.log(options);

	if (options["password"] !== undefined && options["user-name"] !== undefined) {
		server.basicLogin(options["user-name"], options["password"], function (auth) {
			var fs = require("fs");
			fs.writeFile("cookie.tmp", auth);
		})
	}

})();
