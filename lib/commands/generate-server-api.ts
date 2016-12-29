import * as path from "path";

export class GenerateServerApiCommand implements ICommand {
	constructor(private $serviceContractGenerator: IServiceContractGenerator,
				private $fs: IFileSystem) {
	}

	allowedParameters: ICommandParameter[] = [];

	async execute(args: string[]): Promise<void> {
			let result = await  this.$serviceContractGenerator.generate();
			this.$fs.writeFile(path.join(__dirname, "../server-api.d.ts"), result.interfaceFile);
			this.$fs.writeFile(path.join(__dirname, "../server-api.ts"), result.implementationFile);
	}
}
$injector.registerCommand("dev-generate-api", GenerateServerApiCommand);
