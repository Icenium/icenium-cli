import * as path from "path";

export class PrintSamplesCommand implements ICommand {
	constructor(private $samplesService: ISamplesService,
		private frameworkIdentifier: string,
		private $config: IConfiguration) { }

	public async execute(args: string[]): Promise<void> {
		await this.$samplesService.printSamplesInformation(this.frameworkIdentifier);
	}

	public get isDisabled() {
		return this.$config.ON_PREM;
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("sample|*list", $injector.resolve(PrintSamplesCommand, { frameworkIdentifier: "" }));

export class CloneSampleCommand implements ICommand {
	constructor(private $samplesService: ISamplesService,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $config: IConfiguration,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		await this.$samplesService.cloneSample(args[0]);
	}

	public get isDisabled() {
		return this.$config.ON_PREM;
	}

	public allowedParameters: ICommandParameter[] = [new CloneCommandParameter(this.$fs, this.$errors, this.$options)];
}

$injector.registerCommand("sample|clone", CloneSampleCommand);

class CloneCommandParameter implements ICommandParameter {
	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $options: IOptions) { }

	public mandatory = true;

	public async validate(validationValue: string): Promise<boolean> {
		if (validationValue) {
			let sampleName = <string>validationValue;
			let cloneTo = this.$options.path || sampleName;
			if (this.$fs.exists(cloneTo) && this.$fs.readDirectory(cloneTo).length > 0) {
				this.$errors.fail("Cannot clone sample in the specified path. The directory %s is not empty. Specify an empty target directory and try again.", path.resolve(cloneTo));
			}

			return true;
		}

		return false;
	}
}
