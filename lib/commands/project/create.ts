import * as path from "path";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";
import ProjectCommandBaseLib = require("./project-command-base");

export class CreateCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor(private $config: IConfiguration,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $nameCommandParameter: ICommandParameter,
		private $options: IOptions,
		private $screenBuilderService: IScreenBuilderService,
		private $simulatorService: ISimulatorService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		$errors: IErrors,
		$project: Project.IProject) {
		super($errors, $project);
	}

	public async execute(args: string[]): Promise<void> {
			this.validateProjectData();

			let projectName = args[0];
			let newProjectDir = this.$project.getNewProjectDir();
			let projectPath = path.resolve(this.$options.path ? newProjectDir : path.join(newProjectDir, projectName));

			await this.$project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova, this.$config.DEFAULT_CORDOVA_PROJECT_TEMPLATE);
			_.each(this.$screenBuilderService.screenBuilderSpecificFiles, fileName => this.$fs.deleteFile(path.join(projectPath, fileName)));

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions(this.$options.answers, {
				projectPath: projectPath,
				answers: {
					name: projectName
				}
			});

			try {
				await this.$screenBuilderService.prepareAndGeneratePrompt(projectPath, this.$screenBuilderService.generatorFullName, screenBuilderOptions);
			} catch(err) {
				this.$logger.trace(err);
				this.$fs.deleteDirectory(projectPath);
				throw err;
			}

			if (this.$options.simulator && await  this.$simulatorPlatformServices.canRunApplication && this.$simulatorPlatformServices.canRunApplication()) {
				await this.$simulatorService.launchSimulator();
			}
	}

	allowedParameters = [this.$nameCommandParameter];
}
$injector.registerCommand("create|*default", CreateCommand);
$injector.registerCommand("create|screenbuilder", CreateCommand);
