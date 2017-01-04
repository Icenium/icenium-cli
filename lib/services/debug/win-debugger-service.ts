import * as child_process from "child_process";
import * as path from "path";
import * as helpers from "../../helpers";
let gaze = require("gaze");

export class WinDebuggerService implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Tools.Package";
	private static EXECUTABLE_NAME_WIN = "Debugger.Windows.exe";

	constructor(private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $sharedUserSettingsService: IUserSettingsService,
		protected $errors: IErrors,
		private $logger: ILogger,
		private $dispatcher: IFutureDispatcher,
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo) { }

	public get packageName(): string {
		return WinDebuggerService.PACKAGE_NAME_WIN;
	}

	public get executableName(): string {
		return WinDebuggerService.EXECUTABLE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]): void {
		this.startWatchingUserSettingsFile();

		let debuggerBinary = path.join(applicationPath, WinDebuggerService.EXECUTABLE_NAME_WIN);
		let childProcess: child_process.ChildProcess = this.$childProcess.spawn(debuggerBinary, applicationParams);
		this.waitDebuggerExit(childProcess);
	}

	public async canRunApplication(): Promise<boolean> {
		return this.$hostInfo.isDotNet40Installed("Unable to start the debug tool. Verify that you have installed .NET 4.0 or later and try again.");
	}

	public startWatchingUserSettingsFile(): void {
		let _this = this;
		gaze(this.$sharedUserSettingsFileService.userSettingsFilePath, function (err: Error, watchr: any) {
			if (err) {
				_this.$errors.fail(err.toString());
			}

			this.on("changed", (filePath: string) => {
				_this.$dispatcher.dispatch(() => _this.$sharedUserSettingsService.saveSettings({}));
			});
		});
	}

	public waitDebuggerExit(childProcess: child_process.ChildProcess) {
		childProcess.stderr.pipe(process.stderr);
		childProcess.stdin.on("end", () => process.exit());
		helpers.exitOnStdinEnd();
		this.$dispatcher.run();
	}
}

$injector.register("winDebuggerService", WinDebuggerService);
