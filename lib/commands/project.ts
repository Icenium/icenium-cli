///<reference path="../.d.ts"/>
"use strict";
import projectTypes = require("../project-types");

export class ProjectCommandBase implements ICommand {
	constructor(private $project: Project.IProject,
				private $errors: IErrors,
				protected $projectNameValidator?: IProjectNameValidator) {
		if (this.$project.projectData) {
			this.$errors.fail("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
		}
	}

	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return null;
	}

	allowedParameters: ICommandParameter[] = [];

	protected createNewProject(projectType: number, projectName: string): IFuture<void> {
		return this.$project.createNewProject(projectType, projectName);
	}

	protected createProjectFileFromExistingProject(projectType: number): IFuture<void> {
		return this.$project.createProjectFileFromExistingProject(projectType);
	}
}

export class CreateHybridCommand extends ProjectCommandBase {
	constructor($project: Project.IProject,
		$errors: IErrors,
        $projectNameValidator: IProjectNameValidator) {
		super($project, $errors, $projectNameValidator);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(projectTypes.Cordova, args[0]);
	}
    
	allowedParameters = [new NameParameter(this.$projectNameValidator)];
}
$injector.registerCommand("create|hybrid", CreateHybridCommand);

export class CreateWebSiteCommand extends ProjectCommandBase {
	constructor($project: Project.IProject,
				$errors: IErrors,
				$projectNameValidator: IProjectNameValidator) {
		super($project, $errors, $projectNameValidator);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(projectTypes.MobileWebsite, args[0]);
	}

	allowedParameters = [new NameParameter(this.$projectNameValidator)];
}
$injector.registerCommand("create|website", CreateWebSiteCommand);

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
	constructor($project: Project.IProject,
		$errors: IErrors,
		$projectNameValidator: IProjectNameValidator) {
		super($project, $errors, $projectNameValidator);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(projectTypes.NativeScript, args[0]);
	}

	allowedParameters = [new NameParameter(this.$projectNameValidator)];
}
$injector.registerCommand("create|native", CreateNativeCommand);

export class InitHybridCommand extends ProjectCommandBase {
	constructor($project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createProjectFileFromExistingProject(projectTypes.Cordova);
	}
}
$injector.registerCommand("init|hybrid", InitHybridCommand);

export class InitNativeCommand extends ProjectCommandBase {
	constructor($project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createProjectFileFromExistingProject(projectTypes.NativeScript);
	}
}
$injector.registerCommand("init|native", InitNativeCommand);

export class InitWebsiteCommand extends ProjectCommandBase {
	constructor($project: Project.IProject,
				$errors: IErrors) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createProjectFileFromExistingProject(projectTypes.MobileWebsite);
	}
}
$injector.registerCommand("init|website", InitWebsiteCommand);
