///<reference path="../.d.ts"/>
"use strict";

export class CreateHybridCommand implements ICommand {
	constructor(private $project: Project.IProject) {}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createNewCordovaProject(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("create|hybrid", CreateHybridCommand);

export class CreateNativeCommand implements ICommand {
	constructor(private $project: Project.IProject) {}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createNewNativeScriptProject(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("create|native", CreateNativeCommand);

export class InitHybridCommand implements ICommand {
	constructor(private $project: Project.IProject) {}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createCordovaProjectFileFromExistingProject().wait();
		}).future<void>()();
	}
}
$injector.registerCommand("init|hybrid", InitHybridCommand);

export class InitNativeCommand implements ICommand {
	constructor(private $project: Project.IProject) {}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.createNativeScriptProjectFileFromExistingProject().wait();
		}).future<void>()();
	}
}
$injector.registerCommand("init|native", InitNativeCommand);
