///<reference path="../../.d.ts"/>
"use strict";
import helpers = require("../../common/helpers");
import semver = require("semver");

export class ListWebViewsCommand implements ICommand {
	constructor(private $webViewService: IWebViewService,
		private $logger: ILogger,
		private $project: Project.IProject) { }
	
	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureCordovaProject(); 

			let currentProjectVersion = this.$project.projectData.FrameworkVersion;
			let supportedWebViews = this.$webViewService.supportedWebViews;
			
			let data =  _(supportedWebViews)
				.keys()
				.map((platform: string, index: number) => {
					let webViews = _.filter(supportedWebViews[platform], webView => semver.gte(currentProjectVersion, webView.minSupportedVersion));
					return [(++index).toString(), platform, _.map(webViews, webView => webView.name).join(",\n")]; })
				.value();
			let headers =  ["#", "Platform", "Supported Web Views"];
			let table = helpers.createTable(headers, data);
			
			this.$logger.out(table.toString());
			
		}).future<void>()(); 
	}
	
	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("web-view|*list", ListWebViewsCommand);