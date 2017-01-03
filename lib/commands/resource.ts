import * as helpers from "../common/helpers";

class Resource implements ICommand {
	constructor(private $imageService: IImageService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$imageService.printDefinitions();
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("resource|*list", Resource);

class ResourceCreate implements ICommand {
	constructor(private $errors: IErrors,
		private $imageService: IImageService,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		if (this.$options.icon && this.$options.splash) {
			await this.$imageService.generateImages(this.$options.icon, Server.ImageType.Icon, this.$options.force);
			await this.$imageService.generateImages(this.$options.splash, Server.ImageType.SplashScreen, this.$options.force);
		} else if (this.$options.icon) {
			await this.$imageService.generateImages(this.$options.icon, Server.ImageType.Icon, this.$options.force);
		} else if (this.$options.splash) {
			await this.$imageService.generateImages(this.$options.splash, Server.ImageType.SplashScreen, this.$options.force);
		} else if (!helpers.isInteractive()) {
			this.$errors.failWithoutHelp('Console is not interactive');
		} else {
			await this.$imageService.promptForImageInformation(this.$options.force);
		}
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand(["resource|create"], ResourceCreate);
