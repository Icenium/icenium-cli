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

	public async prepareExtension(packageName: string, beforeDownloadExtensionAction: () => IFuture<void>): Promise<void> {
			let cachedVersion = "0.0.0.0";
			let extensionData = {
				packageName: packageName,
				version: this.$serverConfiguration.assemblyVersion.wait(),
				downloadUri: this.getExtensionDownloadUri(packageName).wait()
			};

			this.prepareExtensionBase(extensionData, cachedVersion, { beforeDownloadAction: beforeDownloadExtensionAction }).wait();
	}

	private async getExtensionDownloadUri(packageName: string): Promise<string> {
			let serverUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER;
			let downloadUri: string;

			if (this.$config.USE_CDN_FOR_EXTENSION_DOWNLOAD) {
				let servicesExtensionsUri = serverUri + "/appbuilder/services/extensions";

				this.$logger.trace("Getting extensions from %s", servicesExtensionsUri);

				let extensions = JSON.parse(this.$httpClient.httpRequest(servicesExtensionsUri).wait().body);
				downloadUri = (<any>_.find(extensions["$values"],
					{ Identifier: packageName })).DownloadUri;
			} else {
				downloadUri = serverUri + "/appbuilder/ClientBin/" + packageName + '.xap';
			}

			return downloadUri;
	}
}
$injector.register("serverExtensionsService", ServerExtensionsService);
