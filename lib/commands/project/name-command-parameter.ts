export class NameParameter implements ICommandParameter {
	constructor(private $projectNameValidator: IProjectNameValidator) { }
	mandatory = true;
	async validate(validationValue: string): Promise<boolean> {
			return this.$projectNameValidator.validate(validationValue);
	}
}
$injector.register("nameCommandParameter", NameParameter);
