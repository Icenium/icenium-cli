import { AppBuilderLiveSyncProviderBase } from "../common/appbuilder/providers/appbuilder-livesync-provider-base";
import Future = require("fibers/future");

export class LiveSyncProvider extends AppBuilderLiveSyncProviderBase {
	constructor($androidLiveSyncServiceLocator: { factory: Function },
		$iosLiveSyncServiceLocator: { factory: Function },
		private $buildService: Project.IBuildService,
		private $devicesService: Mobile.IDevicesService,
		private $options: IOptions) {
		super($androidLiveSyncServiceLocator, $iosLiveSyncServiceLocator);
	}

	public buildForDevice(device: Mobile.IDevice): IFuture<string> {
		return this.$devicesService.isiOSSimulator(device) ? this.$buildService.buildForiOSSimulator(this.$options.saveTo, device)
			await : Future.fromResult(this.$buildService.buildForDeploy(this.$devicesService.platform, this.$options.saveTo, false, device).packageName);
	}
}
$injector.register("liveSyncProvider", LiveSyncProvider);
