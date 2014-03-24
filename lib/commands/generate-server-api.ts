///<reference path="../.d.ts"/>
"use strict";

import path = require("path");

export class GenerateServerApiCommand implements ICommand {
	constructor(private $serviceContractGenerator: Server.IServiceContractGenerator,
				private $fs: IFileSystem) {
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			var result = this.$serviceContractGenerator.generate();
			this.$fs.writeFile(path.join(__dirname, "../server-api.d.ts"), result.interfaceFile).wait();
			this.$fs.writeFile(path.join(__dirname, "../server-api.ts"), result.implementationFile).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);