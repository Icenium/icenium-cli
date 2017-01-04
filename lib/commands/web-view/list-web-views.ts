import helpers = require("../../common/helpers");
import semver = require("semver");

export class ListWebViewsCommand implements ICommand {
	constructor(private $webViewService: IWebViewService,
		private $logger: ILogger,
		private $project: Project.IProject) { }

	public async execute(args: string[]): Promise<void> {
		await this.$project.ensureCordovaProject();

		let currentProjectVersion = this.$project.projectData.FrameworkVersion;
		let supportedWebViews = this.$webViewService.supportedWebViews;

		let keys = _.keys(supportedWebViews);

		let data = await Promise.all(_.map(keys, async (platform: string, index: number) => {
			let webViews = _.filter(supportedWebViews[platform], webView => semver.gte(currentProjectVersion, webView.minSupportedVersion));
			return [(++index).toString(), platform, await this.$webViewService.getCurrentWebViewName(platform), _.map(webViews, webView => webView.name).join(",\n")];
		}));
		let headers = ["#", "Platform", "Current Web View", "Supported Web Views"];
		let table = helpers.createTable(headers, data);

		this.$logger.out(table.toString());
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("webview|*list", ListWebViewsCommand);
