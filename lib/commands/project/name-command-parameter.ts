export class NameParameter implements ICommandParameter {
	constructor(private $projectNameValidator: IProjectNameValidator) { }

	public mandatory = true;

	public async validate(validationValue: string): Promise<boolean> {
		return this.$projectNameValidator.validate(validationValue);
	}
}

$injector.register("nameCommandParameter", NameParameter);
