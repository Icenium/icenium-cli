///<reference path="../.d.ts"/>
"use strict";

export class CreateHybridCommand implements ICommand {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes) {}

	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createNewProject(this.$projectTypes.Cordova, args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("create|hybrid", CreateHybridCommand);

export class CreateNativeCommand implements ICommand {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes) {}

	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createNewProject(this.$projectTypes.NativeScript, args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("create|native", CreateNativeCommand);

export class InitHybridCommand implements ICommand {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes) {}

	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createProjectFileFromExistingProject(this.$projectTypes.Cordova).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("init|hybrid", InitHybridCommand);

export class InitNativeCommand implements ICommand {
	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes) {}

	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createProjectFileFromExistingProject(this.$projectTypes.NativeScript).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("init|native", InitNativeCommand);
