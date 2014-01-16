///<reference path="../.d.ts"/>
"use strict";

import fs = require("fs");
import path = require("path");

export class GenerateServerApiCommand implements Commands.ICommand<any> {
	constructor(private $serviceContractGenerator: Server.IServiceContractGenerator) {
	}

	getDataFactory():Commands.ICommandDataFactory {
		return {
			fromCliArguments: function(args: string[]) {
				return undefined;
			}
		};
	}

	canExecute(data: any):boolean {
		return true;
	}

	execute(data: any):void {
		var result = this.$serviceContractGenerator.generate();
		fs.writeFileSync(path.join(__dirname, "../service-proxy.d.ts"), result.interfaceFile);
		fs.writeFileSync(path.join(__dirname, "../service-proxy.ts"), result.implementationFile);
	}
}

$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);