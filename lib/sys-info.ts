import {SysInfoBase} from "./common/sys-info-base";

export class SysInfo extends SysInfoBase {
	constructor(protected $childProcess: IChildProcess,
				protected $hostInfo: IHostInfo,
				protected $iTunesValidator: Mobile.IiTunesValidator,
				protected $logger: ILogger,
				protected $winreg: IWinReg,
				private $staticConfig: IStaticConfig) {
		super($childProcess, $hostInfo, $iTunesValidator, $logger, $winreg);
	}

	public async getSysInfo(pathToPackageJson: string, androidToolsInfo?: {pathToAdb: string, pathToAndroid: string}): Promise<ISysInfoData> {
			let defaultAndroidToolsInfo = {
				pathToAdb: "adb",
				pathToAndroid: "android" + (this.$hostInfo.isWindows ? ".bat" : "")
			};

			return super.getSysInfo(pathToPackageJson  || this.$staticConfig.pathToPackageJson, androidToolsInfo || defaultAndroidToolsInfo).wait();
	}
}
$injector.register("sysInfo", SysInfo);
