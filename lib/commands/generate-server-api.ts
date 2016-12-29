import * as path from "path";

export class GenerateServerApiCommand implements ICommand {
	constructor(private $serviceContractGenerator: IServiceContractGenerator,
				private $fs: IFileSystem) {
	}

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let result = await  this.$serviceContractGenerator.generate();
			this.$fs.writeFile(path.join(__dirname, "../server-api.d.ts"), result.interfaceFile);
			this.$fs.writeFile(path.join(__dirname, "../server-api.ts"), result.implementationFile);
		}).future<void>()();
	}
}
$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);
