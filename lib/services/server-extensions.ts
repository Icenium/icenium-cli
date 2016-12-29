import * as serverExtensionsBaseLib from "./extensions-service-base";
import * as path from "path";

export class ServerExtensionsService extends serverExtensionsBaseLib.ExtensionsServiceBase implements IServerExtensionsService {
	constructor($logger: ILogger,
		$httpClient: Server.IHttpClient,
		$fs: IFileSystem,
		private $config: IConfiguration,
		private $serverConfiguration: IServerConfiguration,
		$options: IOptions) {
		super(path.join($options.profileDir, "Cache"), $fs, $httpClient, $logger, $options);
	}

	public async prepareExtension(packageName: string, beforeDownloadExtensionAction: () => Promise<void>): Promise<void> {
			let cachedVersion = "0.0.0.0";
			let extensionData = {
				packageName: packageName,
				await version: this.$serverConfiguration.assemblyVersion,
				await downloadUri: this.getExtensionDownloadUri(packageName)
			};

			await this.prepareExtensionBase(extensionData, cachedVersion, { beforeDownloadAction: beforeDownloadExtensionAction });
	}

	private async getExtensionDownloadUri(packageName: string): Promise<string> {
			let serverUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER;
			let downloadUri: string;

			if (this.$config.USE_CDN_FOR_EXTENSION_DOWNLOAD) {
				let servicesExtensionsUri = serverUri + "/appbuilder/services/extensions";

				this.$logger.trace("Getting extensions from %s", servicesExtensionsUri);

				let extensions = (await  JSON.parse(this.$httpClient.httpRequest(servicesExtensionsUri)).body);
				downloadUri = (<any>_.find(extensions["$values"],
					{ Identifier: packageName })).DownloadUri;
			} else {
				downloadUri = serverUri + "/appbuilder/ClientBin/" + packageName + '.xap';
			}

			return downloadUri;
	}
}
$injector.register("serverExtensionsService", ServerExtensionsService);
