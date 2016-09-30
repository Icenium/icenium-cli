import { EnsureProjectCommandWithoutArgs } from "./ensure-project-command-without-args";

export class ImportProjectCommand extends EnsureProjectCommandWithoutArgs {
	constructor($project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return	this.$project.importProject();
	}
}
$injector.registerCommand("livesync|cloud", ImportProjectCommand);
$injector.registerCommand("live-sync|cloud", ImportProjectCommand);
