///<reference path=".d.ts"/>
"use strict";

export class HostCapabilities implements IHostCapabilities {

	public get capabilities(): IDictionary<IHostCapability> {
		return {
			"win32": {
				debugToolsSupported: true
			},
			"darwin": {
				debugToolsSupported: true
			},
			"linux": {
				debugToolsSupported: false
			}
		};
	}
}
$injector.register("hostCapabilities", HostCapabilities);
