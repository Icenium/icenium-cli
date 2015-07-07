///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import temp = require("temp");

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
		private $server: Server.IServer) {

		this.$project.ensureProject();

		if (!this.$project.capabilities.imageGeneration) {
			this.$errors.failWithoutHelp("This command is not applicable to %s projects ", this.$project.projectData.Framework);
		}
	}

	public generateImages(initialImagePath: string, imageType: Server.ImageType, force: boolean): IFuture<void> {
		return (() => {
			if (path.extname(initialImagePath) !== ImageConstants.PNG_EXTENSION) {
				this.$errors.failWithoutHelp('The specified image must be in PNG format.');
			}

			temp.track();
			let inputImageStream = this.$fs.createReadStream(initialImagePath),
				tempDir = temp.mkdirSync('ab-images-'),
				resultImageArchivePath = path.join(tempDir, 'images.zip'),
				resultImageArchiveStream = this.$fs.createWriteStream(resultImageArchivePath);

			this.replaceAll = force;
			this.$logger.printInfoMessageOnSameLine('Generating images');
			this.$progressIndicator.showProgressIndicator(this.$server.images.generateArchive(imageType, inputImageStream, resultImageArchiveStream), 2000).wait();
			this.$logger.out(); // Delete this when https://github.com/Icenium/icenium-cli/pull/1139 is merged
			this.$logger.printInfoMessageOnSameLine('Extracting images');
			this.$progressIndicator.showProgressIndicator(this.$fs.unzip(resultImageArchivePath, tempDir), 2000).wait();
			this.$logger.out(); // Delete this when https://github.com/Icenium/icenium-cli/pull/1139 is merged
			this.$fs.unzip(resultImageArchivePath, tempDir).wait();

			let imageBasePath = path.join(tempDir, 'App_Resources'),
				images = this.$fs.enumerateFilesInDirectorySync(imageBasePath);

			_.each(images, imagePath => {
				if (this.$project.projectData.Framework === this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript &&
					~imagePath.indexOf(this.$devicePlatformsConstants.WP8)) {
					// NativeScript does not support WP8 yet
					return;
				}

				let projectImagePath = path.join(this.$project.appResourcesPath().wait(), imagePath.substring(imageBasePath.length));
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
				case replaceOptions[1]:
					return this.$fs.copyFile(imagePath, projectImagePath).wait();
				case replaceOptions[3]:
					this.$errors.failWithoutHelp('Operation aborted');
			}
		}).future<void>()();
	}
}
$injector.register("imageService", ImageService);
