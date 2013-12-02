"use strict";

exports.TFIS_SERVER = "testtfis.telerik.com";
exports.ICE_SERVER_PROTO = "http";
exports.ICE_SERVER = "localhost";
exports.DEBUG = true;
exports.PROXY_TO_FIDDLER = false;
exports.PROJECT_FILE_NAME = ".iceproject";
exports.SOLUTION_SPACE_NAME = "Private_Build_Folder";
exports.QR_SIZE = 300;
exports.DEFAULT_PROJECT_TEMPLATE = "KendoUI";
exports.TEMPLATE_NAMES = [ "Blank", "Everlive", "JQuery", "KendoUI", "KendoUIDataViz" ];

var cibuild = global["config-cibuild"];
if (cibuild) {
	Object.keys(cibuild).forEach(function(key) {
		exports[key] = cibuild[key];
	});
}
