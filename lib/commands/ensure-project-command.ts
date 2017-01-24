import assert = require("assert");

export class EnsureProjectCommand implements ICommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		assert.fail("", "", "You should never get here. Please contact Telerik support and send the output of your command, executed with `--log trace`.", null);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length) {
			this.$errors.fail("This command doesn't accept parameters.");
			return false;
		}

		await this.$project.ensureProject();
		return true;
	}
}
