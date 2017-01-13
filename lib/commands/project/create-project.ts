import * as ProjectCommandBaseLib from "./project-command-base";

export class CreateProjectCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor($errors: IErrors,
		private frameworkIdentifier: string,
		private $nameCommandParameter: ICommandParameter,
		private $options: IOptions,
		$project: Project.IProject) {
		super($errors, $project);
	}

	public async execute(args: string[]): Promise<void> {
		this.validateProjectData();
		return this.$project.createNewProject(args[0], this.frameworkIdentifier, this.$options.template);
	}

	public allowedParameters = [this.$nameCommandParameter];
}
