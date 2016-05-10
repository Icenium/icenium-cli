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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.validateProjectData();

			let projectName = args[0];
			let newProjectDir = this.$project.getNewProjectDir();
			let projectPath = path.resolve(this.$options.path ? newProjectDir : path.join(newProjectDir, projectName));

			this.$project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova, this.$config.DEFAULT_CORDOVA_PROJECT_TEMPLATE).wait();
			_.each(this.$screenBuilderService.screenBuilderSpecificFiles, fileName => this.$fs.deleteFile(path.join(projectPath, fileName)).wait());

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions(this.$options.answers, {
				projectPath: projectPath,
				answers: {
					name: projectName
				}
			}).wait();

			try {

				this.$screenBuilderService.prepareAndGeneratePrompt(projectPath, this.$screenBuilderService.generatorFullName, screenBuilderOptions).wait();
			} catch(err) {
				this.$logger.trace(err);
				this.$fs.deleteDirectory(projectPath).wait();
				throw err;
			}

			if (this.$options.simulator && this.$simulatorPlatformServices.canRunApplication && this.$simulatorPlatformServices.canRunApplication().wait()) {
				this.$simulatorService.launchSimulator().wait();
			}
		}).future<void>()();
	}

	allowedParameters = [this.$nameCommandParameter];
}
$injector.registerCommand("create|*default", CreateCommand);
$injector.registerCommand("create|screenbuilder", CreateCommand);
