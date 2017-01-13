import { EnsureProjectCommand } from "./ensure-project-command";

export class ImportProjectCommand extends EnsureProjectCommand {
	constructor($project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$project.importProject();
	}
}

$injector.registerCommand("livesync|cloud", ImportProjectCommand);
$injector.registerCommand("live-sync|cloud", ImportProjectCommand);
