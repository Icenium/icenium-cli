import { SysInfoBase } from "./common/sys-info-base";

export class SysInfo extends SysInfoBase {
	constructor(protected $childProcess: IChildProcess,
		protected $hostInfo: IHostInfo,
		protected $iTunesValidator: Mobile.IiTunesValidator,
		protected $logger: ILogger,
		protected $winreg: IWinReg,
		private $staticConfig: IStaticConfig,
		protected $androidEmulatorServices: Mobile.IAndroidEmulatorServices) {
		super($childProcess, $hostInfo, $iTunesValidator, $logger, $winreg, $androidEmulatorServices);
	}

	public async getSysInfo(pathToPackageJson: string, androidToolsInfo?: { pathToAdb: string }): Promise<ISysInfoData> {
		let defaultAndroidToolsInfo = {
			pathToAdb: "adb"
		};

		return super.getSysInfo(pathToPackageJson || await this.$staticConfig.pathToPackageJson, androidToolsInfo || defaultAndroidToolsInfo);
	}
}
$injector.register("sysInfo", SysInfo);
