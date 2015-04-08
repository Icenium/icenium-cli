///<reference path="../.d.ts"/>
"use strict";

import commandParams = require("../common/command-params");

export class PublishListCommand implements ICommand {
	constructor(private $injector: IInjector,
		private $publishService: IPublishService) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(this.$injector), 
		new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

	execute(args: string[]): IFuture<void> {
		return (() => { 
			if (args.length === 0) {
					return this.$publishService.listAllConnections();
			}

			var idOrUrl = args[0];
			var username = args[1];
			var password = args[2];

			this.$publishService.publish(idOrUrl, username, password).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("publish|*list", PublishListCommand);

export class PublishAddCommand implements ICommand {
	constructor(private $injector: IInjector,
		private $publishService: IPublishService) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];
		
	execute(args: string[]): IFuture<void> {
		var name = args[0];
		var publishUrl = args[1];
		
		return this.$publishService.addConnection(name, publishUrl);
	}
}
$injector.registerCommand("publish|add", PublishAddCommand);

export class PublishRemoveCommand implements ICommand {
	constructor(private $publishService: IPublishService,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify connection name or index.")];

	execute(args: string[]): IFuture<void> {
		var idOrName = args[0];
		return this.$publishService.removeConnection(idOrName);
	}
}
$injector.registerCommand("publish|remove", PublishRemoveCommand);