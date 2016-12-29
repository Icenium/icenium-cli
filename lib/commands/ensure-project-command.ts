import Future = require("fibers/future");
import assert = require("assert");

export class EnsureProjectCommand implements ICommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors) { }

	allowedParameters: ICommandParameter[] = [];

	async execute(args: string[]): Promise<void> {
		assert.fail("","", "You should never get here. Please contact Telerik support and send the output of your command, executed with `--log trace`.");
		return Promise.resolve();
	}

	async canExecute(args: string[]): Promise<boolean> {
			if(args.length) {
  				this.$errors.fail("This command doesn't accept parameters.");
				return false;
  			}

			this.$project.ensureProject();
			return true;
	}
}
