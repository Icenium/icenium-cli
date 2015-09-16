///<reference path="../.d.ts"/>
"use strict";

import * as helpers from "../common/helpers";
import * as path from "path";
import temp = require("temp");

class ImageData {
	constructor(public FileName: string,
		public Height: number,
		public Width: number) {
	}
}

class ImageDefinitionData {
	constructor(public Platform: string,
		public Icons: ImageData[],
		public SplashScreens: ImageData[]) {
	}
}

class ImageConstants {
	public static PNG_EXTENSION = '.png';
}

class ImageService implements IImageService {
	private replaceAll: boolean;

	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $progressIndicator: IProgressIndicator,
		private $projectConstants: Project.IProjectConstants,
		private $project: Project.IProject,
		private $prompter: IPrompter,
		private $staticConfig: Config.IStaticConfig,
		private $resources: IResourceLoader,
		private $server: Server.IServer) {

		this.$project.ensureProject();

		if (!this.$project.capabilities.imageGeneration) {
			this.$errors.failWithoutHelp("This command is not applicable to %s projects ", this.$project.projectData.Framework);
		}
	}

	public printDefinitions(): IFuture<void> {
		return (() => {
			let imageDefinitionsFilePath = path.join(this.$staticConfig.APP_RESOURCES_DIR_NAME, this.$projectConstants.IMAGE_DEFINITIONS_FILE_NAME),
				imageDefinitionsContents: ImageDefinitionData[] = this.$resources.readJson(imageDefinitionsFilePath).wait(),
				table = helpers.createTable(['Platform', 'Icon', 'Splash Screen'], []);

			_.each(imageDefinitionsContents, imageDefinition => {
				if (imageDefinition.Platform === 'WP8' && !this.$project.capabilities.wp8Supported) {
					return;
				}

				let maxLength = Math.max(imageDefinition.Icons.length, imageDefinition.SplashScreens.length);

				for (let i = 0; i < maxLength; ++i) {
					let platformName = i ? '' : imageDefinition.Platform;
					this.pushImageToTable(table, platformName, imageDefinition.Icons[i], imageDefinition.SplashScreens[i]);
				}

				table.push(['', '', '']);
			});

			this.$logger.out(table.toString());
		}).future<void>()();
	}

	public promptForImageInformation(force: boolean): IFuture<void> {
		return (() => {
			let imagePath = this.$prompter.getString('Enter image file path:').wait(),
				imageOptions = ['Icons', 'Splash Screens'],
				chosenOption = this.$prompter.promptForChoice(`What type of resources do you want to create?`, imageOptions).wait(),
				imageType = Server.ImageType.Icon;

			imagePath = helpers.trimSymbol(imagePath, '"');

			if (chosenOption === imageOptions[1]) {
				imageType = Server.ImageType.SplashScreen;
			}

			this.generateImages(imagePath, imageType, force).wait();
		}).future<void>()();
	}

	public generateImages(initialImagePath: string, imageType: Server.ImageType, force: boolean): IFuture<void> {
		return (() => {
			this.validateImage(initialImagePath).wait();

			temp.track();
			let inputImageStream = this.$fs.createReadStream(initialImagePath),
				tempDir = temp.mkdirSync('ab-images-'),
				resultImageArchivePath = path.join(tempDir, 'images.zip'),
				resultImageArchiveStream = this.$fs.createWriteStream(resultImageArchivePath);

			this.replaceAll = force;
			this.$logger.printInfoMessageOnSameLine('Generating images');
			this.$progressIndicator.showProgressIndicator(this.$server.images.generateArchive(imageType, inputImageStream, resultImageArchiveStream), 2000).wait();
			this.$logger.printInfoMessageOnSameLine('Extracting images');
			this.$progressIndicator.showProgressIndicator(this.$fs.unzip(resultImageArchivePath, tempDir), 2000).wait();
			this.$fs.unzip(resultImageArchivePath, tempDir).wait();
			this.$fs.deleteFile(resultImageArchivePath).wait();

			let images = this.$fs.enumerateFilesInDirectorySync(tempDir);

			_.each(images, imagePath => {
				if (!this.$project.capabilities.wp8Supported && ~imagePath.indexOf(this.$devicePlatformsConstants.WP8)) {
					return;
				}

				let projectImagePath = path.join(this.$project.appResourcesPath().wait(), imagePath.substring(tempDir.length));
				this.copyImageToProject(imagePath, projectImagePath).wait();
			});
		}).future<void>()();
	}

	private copyImageToProject(imagePath: string, projectImagePath: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(path.dirname(projectImagePath)).wait();

			if (this.replaceAll || !this.$fs.exists(projectImagePath).wait()) {
				return this.$fs.copyFile(imagePath, projectImagePath).wait();
			}

			let replaceOptions = ['Yes for all', 'Yes', 'No', 'No for all'],
				chosenOption = this.$prompter.promptForChoice(`${projectImagePath} already exists, do you want to replace it?`, replaceOptions).wait();

			switch (chosenOption) {
				case replaceOptions[0]:
					this.replaceAll = true;
					return this.$fs.copyFile(imagePath, projectImagePath).wait();
				case replaceOptions[1]:
					return this.$fs.copyFile(imagePath, projectImagePath).wait();
				case replaceOptions[3]:
					this.$errors.failWithoutHelp('Operation canceled.');
			}
		}).future<void>()();
	}

	private pushImageToTable(table: any, platform: string, icon: ImageData, splashScreen: ImageData): void {
		let iconPath = this.getImagePath(icon),
			iconDimensions = this.getImageDimensions(icon),
			splashScreenPath = this.getImagePath(splashScreen),
			splashScreenDimensions = this.getImageDimensions(splashScreen);

		table.push([platform, iconPath, splashScreenPath]);
		table.push(['', iconDimensions, splashScreenDimensions]);
		table.push(['', '', '']);
	}

	private validateImage(imagePath: string): IFuture<void> {
		return (() => {
			if (!imagePath) {
				this.$errors.failWithoutHelp('You must providе a valid image path.');
			}

			if (!this.$fs.exists(imagePath).wait()) {
				this.$errors.failWithoutHelp(`The specified file ${imagePath} does not exist.`);
			}

			if (path.extname(imagePath) !== ImageConstants.PNG_EXTENSION) {
				this.$errors.failWithoutHelp('You must specify a PNG image source.');
			}
		}).future<void>()();
	}

	private getImageDimensions(image: ImageData): string {
		return image ? `Dimensions: ${image.Width}x${image.Height}` : '';
	}

	private getImagePath(image: ImageData): string {
		return image ? `Path: ${image.FileName}` : '';
	}
}
$injector.register("imageService", ImageService);
