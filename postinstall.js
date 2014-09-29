var child_process = require("child_process");
var command = process.argv[0] + ' bin/appbuilder.js dev-post-install';
child_process.exec(command);