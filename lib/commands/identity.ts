///<reference path="../.d.ts"/>
"use strict";

import baseCommands = require("./base-commands");

export class ListCertificatesCommand extends baseCommands.BaseParameterlessCommand {
	constructor(private $identityManager: Server.IIdentityManager){
		super();
	}

	execute():void {
		this.$identityManager.listCertificates();
	}
}
$injector.registerCommand("list-certificates", ListCertificatesCommand);

export class ListProvisionsCommand extends baseCommands.BaseParameterlessCommand {
	constructor(private $identityManager: Server.IIdentityManager){
		super();
	}

	execute():void {
		this.$identityManager.listProvisions();
	}
}
$injector.registerCommand("list-provisions", ListProvisionsCommand);
