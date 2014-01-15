///<reference path="../.d.ts"/>
"use strict";

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
		this.$serviceContractGenerator.generate();
	}
}

$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);