///<reference path="../.d.ts"/>

"use strict";

import Future = require("fibers/future");

export class PostInstallCommand implements ICommand {
	constructor(private $templatesService: ITemplatesService) { }

	public execute(args:string[]): IFuture<void> {
		return (() => {
			this.$templatesService.downloadProjectTemplates().wait();
			this.$templatesService.downloadItemTemplates().wait();
		}).future<void>()();
	}
}

$injector.registerCommand("post-install", PostInstallCommand);