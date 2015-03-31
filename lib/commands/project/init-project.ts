///<reference path="../../.d.ts"/>
"use strict";

export class InitProjectCommand implements ICommand {
	constructor(private frameworkIdentifier: string,
		private $project: Project.IProject,
		private $logger: ILogger) { }

	public execute(args: string[]): IFuture<void> {
		return this.initializeProjectFromExistingFiles(this.frameworkIdentifier);
	}

	public initializeProjectFromExistingFiles(frameworkIdentifier: string): IFuture<void> {
		return (() => {
			this.$project.initializeProjectFromExistingFiles(frameworkIdentifier).wait();
			this.$logger.out("Successfully initialized %s project.", frameworkIdentifier);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}