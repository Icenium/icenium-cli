import * as path from "path";
import * as helpers from "../helpers";

export class EditConfigurationCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors,
		private $project: Project.IProject) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			let template = _.find(this.$project.projectConfigFiles, { template: validationValue });
			if(!template) {
				if(validationValue) {
					this.$errors.fail("There is no matching configuration file for: %s", validationValue);
				} else {
					this.$errors.fail("You must choose which configuration file to edit!");
				}
			}

			return true;
		}).future<boolean>()();
	}
}

export class EditConfigurationCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $opener: IOpener,
		private $options: IOptions,
		private $project: Project.IProject,
		private $templatesService: ITemplatesService) {
	}

	allowedParameters = [new EditConfigurationCommandParameter(this.$errors, this.$project)];

	execute(args: string[]): IFuture<void> {
		let file = args[0];
		let template = _.find(this.$project.projectConfigFiles, { template: file });
		return this.executeImplementation(template);
	}

	private executeImplementation(template: Project.IConfigurationFile): IFuture<void> {
		return (() => {
			this.$project.ensureProject();
			let projectPath = this.$project.getProjectDir();
			let filepath = path.join(projectPath, template.filepath);
			let directory = path.dirname(filepath);
			if (!this.$fs.exists(filepath)) {
				this.$logger.info("Creating configuration file: " + filepath);
				let templateFilePath = path.join(this.$templatesService.itemTemplatesDir, template.templateFilepath);
				this.$fs.unzip(templateFilePath, directory).wait();

				//delete extra file in template zip
				this.$fs.deleteFile(path.join(directory, "server.vstemplate")).wait();
				if (this.$hostInfo.isWindows) {
					let contents = this.$fs.readText(filepath).wait();
					contents = helpers.stringReplaceAll(contents, "\n", "\r\n");
					this.$fs.writeFile(filepath, contents).wait();
				}
			}

			if(!this.$options.skipUi) {
				this.$logger.info("Opening configuration file: " + filepath);
				this.$opener.open(filepath);
			}
		}).future<void>()();
	}
}
$injector.registerCommand("edit-configuration", EditConfigurationCommand);
