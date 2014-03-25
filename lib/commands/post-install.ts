///<reference path="../.d.ts"/>

"use strict";

import Future = require("fibers/future");

export class PostInstallCommand implements ICommand {
	constructor(private $templatesService: ITemplatesService,
		private $serviceProxy: Server.IServiceProxy) { }

	public execute(args:string[]): IFuture<void> {
		return (() => {
			this.$serviceProxy.setShouldAuthenticate(false);
			this.$templatesService.downloadProjectTemplates().wait();
			this.$templatesService.downloadItemTemplates().wait();
			this.$serviceProxy.setShouldAuthenticate(true);
		}).future<void>()();
	}
}

$injector.registerCommand("dev-post-install", PostInstallCommand);