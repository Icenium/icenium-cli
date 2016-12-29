import * as projectPropertyCommandBaseLib from "./prop-command-base";

export class PrintProjectCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector,
		protected $options: IOptions) {
		super($staticConfig, $injector);
		if(!this.$options.validValue) {
			this.$project.ensureProject();
		}
	}

	async execute(args:string[]): Promise<void> {
			let configs = this.$project.getConfigurationsSpecifiedByUser();
			if(configs.length) {
				_.each(configs, config => {
					await this.$project.printProjectProperty(args[0], config);
				});
			} else {
				await this.$project.printProjectProperty(args[0]);
			}
	}

	allowedParameters:ICommandParameter[] = [new PrintProjectCommandParameter(this.$project)];
}
$injector.registerCommand("prop|print", PrintProjectCommand);

class PrintProjectCommandParameter implements ICommandParameter {
	constructor(private $project: Project.IProject) { }

	mandatory = false;

	async validate(validationValue: string): Promise<boolean> {
			return !!validationValue;
	}
}
