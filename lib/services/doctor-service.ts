///<reference path="../.d.ts"/>
"use strict";
import {EOL} from "os";
import * as helpers from "../helpers";

class DoctorService implements IDoctorService {

	constructor(
		private $hostInfo: IHostInfo,
		private $sysInfo: ISysInfo,
		private $logger: ILogger,
		private $staticConfig: IStaticConfig) {	}

	public printWarnings(): IFuture<boolean> {
		return ((): boolean => {
			let result = false;
			let sysInfo = this.$sysInfo.getSysInfo(this.$staticConfig.pathToPackageJson).wait();

			if (!sysInfo.adbVer) {
				this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly. ");
				this.$logger.out("For Android-related operations, the AppBuilder CLI will use a built-in version of adb." + EOL
					+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + EOL
					+ "Android devices, verify that you have installed the latest Android SDK and" + EOL
					+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL);

				this.printPackageManagerTip();
				result = true;
			}
			if (!sysInfo.androidInstalled) {
				this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
				this.$logger.out("You will not be able to run your apps in the native emulator. To be able to run apps" + EOL
					+ "in the native Android emulator, verify that you have installed the latest Android SDK " + EOL
					+ "and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL
				);

				this.printPackageManagerTip();
				result = true;
			}
			if (!sysInfo.itunesInstalled) {
				this.$logger.warn("WARNING: iTunes is not installed.");
				this.$logger.out("You will not be able to work with iOS devices via cable connection." + EOL
					+ "To be able to work with connected iOS devices," + EOL
					+ "download and install iTunes from http://www.apple.com" + EOL);
				result = true;
			}
			if(!sysInfo.javaVer) {
				this.$logger.warn("WARNING: The Java Development Kit (JDK) is not installed or is not configured properly.");
				this.$logger.out("You will not be able to work with the Android SDK and you might not be able" + EOL
					+ "to perform some Android-related operations. To ensure that you can develop and" + EOL
					+ "test your apps for Android, verify that you have installed the JDK as" + EOL
					+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8)" + EOL
					+ "or http://docs.oracle.com/javase/7/docs/webnotes/install/ (for JDK 7)." + EOL);
				result = true;
			}
			if(this.$hostInfo.isDarwin && (!sysInfo.monoVer || helpers.versionCompare(sysInfo.monoVer, "3.12.0") < 0)) {
				this.$logger.warn("WARNING: Mono 3.12 or later is not installed or not configured properly.");
				this.$logger.out("You will not be able to work with Android devices in the device simulator or debug on connected Android devices." + EOL
					+ "To be able to work with Android in the device simulator and debug on connected Android devices," + EOL
					+ "download and install Mono 3.12 or later from http://www.mono-project.com/download/" + EOL);
				result = true;
			}
			if(!sysInfo.gitVer) {
				this.$logger.warn("WARNING: Git is not installed or not configured properly.");
				this.$logger.out("You will not be able to create and work with Screen Builder projects." + EOL
					+ "To be able to work with Screen Builder projects, download and install Git as described" + EOL
					+ "in https://git-scm.com/downloads and add the git executable to your PATH." + EOL);
				result = true;
			}

			return result;
		}).future<boolean>()();
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}
}
$injector.register("doctorService", DoctorService);
