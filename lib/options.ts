import commonOptionsLibPath = require("./common/options");
import * as osenv from "osenv";
import * as path  from "path";

let OptionType = commonOptionsLibPath.OptionType;

export class Options extends commonOptionsLibPath.OptionsBase {
	constructor($errors: IErrors,
		$staticConfig: IStaticConfig,
		$hostInfo: IHostInfo) {
		super({
			all: { type: OptionType.Boolean},
			answers: { type: OptionType.String },
			available: { type: OptionType.Boolean },
			certificate: { type: OptionType.String  },
			companion: { type: OptionType.Boolean },
			core: { type: OptionType.Boolean },
			count: { type: OptionType.Number },
			debug: { type: OptionType.Boolean, alias: "d" },
			deploy: { type: OptionType.String },
			download: { type: OptionType.Boolean },
			force: { type: OptionType.Boolean, alias: "f" },
			group: { type: OptionType.Array },
			icon: { type: OptionType.String},
			latest: { type: OptionType.Boolean },
			mandatory: { type: OptionType.Boolean},
			professional: { type: OptionType.Boolean },
			provision: { type: OptionType.String  },
			public: { type: OptionType.Boolean },
			publish: { type: OptionType.Boolean },
			saveTo: { type: OptionType.String},
			screenBuilderCacheDir: { type: OptionType.String },
			sendEmail: { type: OptionType.Boolean },
			sendPush: { type: OptionType.Boolean },
			simulator: { type: OptionType.Boolean, default: true},
			skipUi: { type: OptionType.Boolean },
			splash: { type: OptionType.String},
			template: { type: OptionType.String, alias: "t" },
			validValue: { type: OptionType.Boolean },
			verified: { type: OptionType.Boolean }
		},
		path.join($hostInfo.isWindows ? process.env.LocalAppData : path.join(osenv.home(), ".local/share"), "Telerik", "BlackDragon", ".appbuilder-cli"),
			$errors, $staticConfig);

		let that = <any>this;
		that.screenBuilderCacheDir = path.join((($hostInfo.isWindows && this.defaultProfileDir === that.profileDir) ? path.join(process.env.LocalAppData, "Telerik"): that.profileDir), "sb");
	}
}
$injector.register("options", Options);
