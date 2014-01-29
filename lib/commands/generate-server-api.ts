///<reference path="../.d.ts"/>
"use strict";

import fs = require("fs");
import path = require("path");

export class GenerateServerApiCommand implements ICommand {
	constructor(private $serviceContractGenerator: Server.IServiceContractGenerator) {
	}

	execute(args: string[]):void {
		var result = this.$serviceContractGenerator.generate();
		fs.writeFileSync(path.join(__dirname, "../server-api.d.ts"), result.interfaceFile);
		fs.writeFileSync(path.join(__dirname, "../server-api.ts"), result.implementationFile);
	}
}
$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);