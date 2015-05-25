///<reference path=".d.ts"/>
"use strict";

import commonOptionsLibPath = require("./common/options");
import osenv = require("osenv");
import path = require("path");

let OptionType = commonOptionsLibPath.OptionType;

export class Options extends commonOptionsLibPath.OptionsBase {
	constructor($errors: IErrors,
		$staticConfig: IStaticConfig,
		$hostInfo: IHostInfo) {
		super({
			companion: { type: OptionType.Boolean },
			download: { type: OptionType.Boolean },
			certificate: { type: OptionType.String  },
			provision: { type: OptionType.String  },
			template: { type: OptionType.String, alias: "t" },
			deploy: { type: OptionType.String },
			saveTo: { type: OptionType.String},
			client: { type: OptionType.String },
			available: { type: OptionType.Boolean },
			release: { type: OptionType.Boolean, alias: "r" },
			debug: { type: OptionType.Boolean, alias: "d" },
			validValue: { type: OptionType.Boolean },
			screenBuilderCacheDir: { type: OptionType.String },
			force: { type: OptionType.Boolean, alias: "f" },
			core: { type: OptionType.Boolean },
			professional: { type: OptionType.Boolean },
			latest: { type: OptionType.Boolean },
			verified: { type: OptionType.Boolean },
			publish: { type: OptionType.Boolean },
			sendPush: { type: OptionType.Boolean },
			sendEmail: { type: OptionType.Boolean },
			group: { type: OptionType.Array },
			default: {type: OptionType.Boolean}
		},
		path.join($hostInfo.isWindows ? process.env.LocalAppData : path.join(osenv.home(), ".local/share"), "Telerik", "BlackDragon", ".appbuilder-cli"),
			$errors, $staticConfig);
		
		let that = <any>this;
		that.screenBuilderCacheDir = ($hostInfo.isWindows && this.defaultProfileDir === that.profileDir) ? path.join(process.env.LocalAppData, "Telerik", "sb"): that.profileDir;
	}
}
$injector.register("options", Options);
