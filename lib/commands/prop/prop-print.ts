import * as projectPropertyCommandBaseLib from "./prop-command-base";
import { cache, invokeInit } from "../../common/decorators";

export class PrintProjectCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector,
		protected $options: IOptions) {
		super($staticConfig, $injector);
	}

	@cache()
	public async init(): Promise<void> {
		if (!this.$options.validValue) {
			await super.init();
		}
	}

	@invokeInit()
	public async execute(args: string[]): Promise<void> {
		let configs = this.$project.getConfigurationsSpecifiedByUser();
		if (configs.length) {
			Promise.all(_.map(configs, async config => {
				await this.$project.printProjectProperty(args[0], config);
			}));
		} else {
			await this.$project.printProjectProperty(args[0]);
		}
	}

	public allowedParameters: ICommandParameter[] = [new PrintProjectCommandParameter(this.$project)];
}

$injector.registerCommand("prop|print", PrintProjectCommand);

class PrintProjectCommandParameter implements ICommandParameter {
	constructor(private $project: Project.IProject) { }

	public mandatory = false;

	public async validate(validationValue: string): Promise<boolean> {
		return !!validationValue;
	}
}
