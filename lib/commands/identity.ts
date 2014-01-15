///<reference path="../.d.ts"/>
"use strict";

export class ListCertificatesCommand implements Commands.ICommand<any> {
	constructor(private $identityManager: Server.IIdentityManager){
	}

	getDataFactory():Commands.ICommandDataFactory {
		return {
			fromCliArguments: function() {
				return null;
			}
		}
	}

	canExecute(data:any):boolean {
		return true;
	}

	execute(data:any):void {
		this.$identityManager.listCertificates();
	}
}
$injector.registerCommand("list-certificates", ListCertificatesCommand);

export class ListProvisionsCommand implements Commands.ICommand<any> {
	constructor(private $identityManager: Server.IIdentityManager){
	}

	getDataFactory():Commands.ICommandDataFactory {
		return {
			fromCliArguments: function() {
				return null;
			}
		}
	}

	canExecute(data:any):boolean {
		return true;
	}

	execute(data:any):void {
		this.$identityManager.listProvisions();
	}
}
$injector.registerCommand("list-provisions", ListProvisionsCommand);
