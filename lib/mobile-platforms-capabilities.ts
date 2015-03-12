///<reference path=".d.ts"/>
"use strict";

export class MobilePlatformsCapabilities implements Mobile.IPlatformsCapabilities {
	private platformCapabilities: IDictionary<Mobile.IPlatformCapabilities>;

	constructor(private $errors: IErrors) { }

	public getPlatformNames(): string[]{
		return _.keys(this.getAllCapabilities());
	}

	public getAllCapabilities(): IDictionary<Mobile.IPlatformCapabilities> {
		if(this.platformCapabilities) {
			return this.platformCapabilities;
		}

		var platformCapabilities: IDictionary<Mobile.IPlatformCapabilities> = {
			iOS: {
				wirelessDeploy: true,
				cableDeploy: true,
				companion: true,
				hostPlatformsForDeploy: ["win32", "darwin"]
			},
			Android: {
				wirelessDeploy: true,
				cableDeploy: true,
				companion: true,
				hostPlatformsForDeploy: ["win32", "darwin", "linux"]
			},
			WP8: {
				wirelessDeploy: true,
				cableDeploy: false,
				companion: true,
				hostPlatformsForDeploy: ["win32"]
			}
		}

		return platformCapabilities;
	}
}
$injector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);