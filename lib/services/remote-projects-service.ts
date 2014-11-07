///<reference path="../.d.ts"/>

"use strict";
import util = require("util");
import path = require("path");
import helpers = require("../helpers");
import unzip = require("unzip");
var options:any = require("../options");

export class RemoteProjectService implements IRemoteProjectService {
	private projectName: string;

	constructor(
		private $server: Server.IServer,
		private $userDataStore: IUserDataStore,
		private $serviceProxy: Server.IServiceProxy,
		private $errors: IErrors) { }

	public  makeTapServiceCall<T>(call: () => IFuture<T>): IFuture<T> {
		return (() => {
			var user = this.$userDataStore.getUser().wait();
			var tenantId = user.tenant.id;
			this.$serviceProxy.setSolutionSpaceName(tenantId);
			try {
				return call().wait();
			} finally {
				this.$serviceProxy.setSolutionSpaceName(null);
			}
		}).future<T>()();
	}

	public getProjectName(projectId: string): IFuture<string> {
		return ((): string => {
			if (!this.projectName) {
				var data = this.getProjects().wait();

				if(_.findWhere(data, { name: projectId })) {
					this.projectName = projectId;
				} else if(helpers.isNumber(projectId)) {
					var index = parseInt(projectId, 10);
					if(index < 1 || index > data.length) {
						if(data.length === 0) {
							this.$errors.fail("You do not have any projects.");
						}
						else {
							this.$errors.fail("The project index must be between 1 and %s", data.length);
						}
					} else {
						this.projectName = data[index - 1].name;
					}
				} else {
					this.$errors.fail("The project '%s' was not found.", projectId);
				}
			}

			return this.projectName;
		}).future<string>()();
	}

	public getProjects(): IFuture<any> {
		return this.makeTapServiceCall(() => this.$server.tap.getExistingClientSolutions());
	}

	public getProjectProperties(projectName: string): IFuture<any> {
		return (() => {
			var solutionData = this.getSolutionData(projectName).wait();
			var properties = solutionData.Items[0]["Properties"];
			properties.ProjectName = projectName;
			return properties;
		}).future()();
	}

	private getSolutionData(projectName: string): IFuture<Server.SolutionData> {
		return this.makeTapServiceCall(() => this.$server.projects.getSolution(projectName, true));
	}
}
$injector.register("remoteProjectService", RemoteProjectService);
