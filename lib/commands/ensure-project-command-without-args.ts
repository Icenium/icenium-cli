import {EnsureProjectCommand} from "./ensure-project-command";

export class EnsureProjectCommandWithoutArgs extends EnsureProjectCommand {
	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (args.length) {
				this.$errors.fail("This command doesn't accept parameters.");
			}

			return super.canExecute(args);
		}).future<boolean>()();
	}
}
