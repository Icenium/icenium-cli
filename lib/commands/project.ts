///<reference path="../.d.ts"/>
"use strict";

export class ProjectCommandBase implements ICommand {
	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return null;
	}

	allowedParameters: ICommandParameter[] = [];
}

export class CreateHybridCommand extends ProjectCommandBase {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes,
		private $errors: IErrors,
        private $projectNameValidator: IProjectNameValidator) {
		super();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (this.$project.projectData) {
				this.$errors.fail("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			this.$project.createNewProject(this.$projectTypes.Cordova, args[0]).wait();
		}).future<void>()();
	}
    
	allowedParameters = [new NameParameter(this.$projectNameValidator)];
}
$injector.registerCommand("create|hybrid", CreateHybridCommand);

export class NameParameter implements ICommandParameter {
	constructor(private $projectNameValidator: IProjectNameValidator) { }
	mandatory = true;
	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(validationValue) {
				return this.$projectNameValidator.validate(validationValue);
			}

			return false;
		}).future<boolean>()();
	}
}
$injector.register("nameCommandParameter", NameParameter);

export class CreateNativeCommand extends ProjectCommandBase {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes,
		private $errors: IErrors,
		private $projectNameValidator: IProjectNameValidator) {
		super();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (this.$project.projectData) {
				this.$errors.fail("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			this.$project.createNewProject(this.$projectTypes.NativeScript, args[0]).wait();
		}).future<void>()();
	}

	allowedParameters = [new NameParameter(this.$projectNameValidator)];
}
$injector.registerCommand("create|native", CreateNativeCommand);

export class InitHybridCommand extends ProjectCommandBase {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes,
		private $errors: IErrors) {
		super();
	}

	allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (this.$project.projectData) {
				this.$errors.fail("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			this.$project.createProjectFileFromExistingProject(this.$projectTypes.Cordova).wait();
		}).future<void>()();
	}

}
$injector.registerCommand("init|hybrid", InitHybridCommand);

export class InitNativeCommand extends ProjectCommandBase {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes,
		private $errors: IErrors) {
		super();
	}

	allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (this.$project.projectData) {
				this.$errors.fail("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			this.$project.createProjectFileFromExistingProject(this.$projectTypes.NativeScript).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("init|native", InitNativeCommand);
