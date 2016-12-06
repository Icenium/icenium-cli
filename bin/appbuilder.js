#!/usr/bin/env node

"use strict";
// Use only var here, `let, const` are not supported in Node.js 0.10, 0.12
var path = require("path");
var node = require("../package.json").engines.node;
require(path.join(__dirname, "..", "lib", "common", "verify-node-version")).verifyNodeVersion(node, "AppBuilder");

require("../lib/appbuilder-cli.js");
