import * as helpers from "./common/helpers";

export class ProcessInfo implements IProcessInfo {
	constructor(private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo) { }

	public async isRunning(name: string): Promise<boolean> {
		let result: boolean;

		if (this.$hostInfo.isWindows) {
			if (!_.endsWith(name.toLowerCase(), ".exe")) {
				name = name + ".exe";
			}
			// windows returns localized text whether the app is running or not. But when it is running, the name of the process is in the output
			result = (await this.$childProcess.spawnFromEvent("tasklist.exe", ["/fi", 'imagename eq ' + name], "close")).stdout.indexOf(name) !== -1;
		} else if (this.$hostInfo.isDarwin) {
			result = (await this.$childProcess.spawnFromEvent("ps", ["xc"], "close")).stdout.indexOf(name) !== -1;
		} else if (this.$hostInfo.isLinux) {
			result = (await !helpers.isNullOrWhitespace(this.$childProcess.spawnFromEvent("ps", ["--no-headers", "-C", name], "close")).stdout);
		}

		return result;
	}
}

$injector.register("processInfo", ProcessInfo);
