///<reference path="../.d.ts"/>
"use strict";

import baseCommands = require("./base-commands");
import fs = require("fs");
import path = require("path");

export class GenerateServerApiCommand extends baseCommands.BaseParameterlessCommand {
	constructor(private $serviceContractGenerator: Server.IServiceContractGenerator) {
		super();
	}

	execute():void {
		var result = this.$serviceContractGenerator.generate();
		fs.writeFileSync(path.join(__dirname, "../server-api.d.ts"), result.interfaceFile);
		fs.writeFileSync(path.join(__dirname, "../server-api.ts"), result.implementationFile);
	}
}

$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);