import ValidationResult = require("../common/validators/validation-result");

export class BaseValidator<Input> implements IValidator<Input> {
	constructor(private $injector: IInjector) { }

	public throwIfInvalid(data: Input): void {
		let validationResult: IValidationResult = this.validate(data);
		if (!validationResult.isSuccessful) {
			this.$injector.resolve("$errors").fail(validationResult.error);
		}
	}

	public validate(data: Input): IValidationResult {
		return ValidationResult.ValidationResult.Successful;
	}

	public validateProperty(data: Input, propertyName: string): IValidationResult {
		return ValidationResult.ValidationResult.Successful;
	}
}

export abstract class BaseAsyncValidator<Input> implements IAsyncValidator<Input> {
	constructor(private $injector: IInjector) { }

	public async throwIfInvalid(data: Input): Promise<void> {
		let validationResult: IValidationResult = await this.validate(data);
		if (!validationResult.isSuccessful) {
			this.$injector.resolve("$errors").fail(validationResult.error);
		}
	}

	public async validate(data: Input): Promise<IValidationResult> {
		return ValidationResult.ValidationResult.Successful;
	}

	public async validateProperty(data: Input, propertyName: string): Promise<IValidationResult> {
		return ValidationResult.ValidationResult.Successful;
	}

	public abstract validateCertificate(certificate: ICryptographicIdentity, provision: IProvision): IValidationResult;

	public abstract validateProvision(provision: IProvision): IValidationResult;
}

export class Helpers {
	public static validate(validators: Function[]): IValidationResult {
		let validationResults = <IValidationResult[]>_.map(validators, (validator) => validator());
		let firstFailedValidationResult = Helpers.getFirstFailedValidationResult(validationResults);
		if (firstFailedValidationResult) {
			return firstFailedValidationResult;
		}
		return ValidationResult.ValidationResult.Successful;
	}

	public static async validateAsync(validators: GenericFunction<Promise<IValidationResult>>[]): Promise<IValidationResult> {
		let validationResults = await Promise.all(_.map(validators, (validator) => validator()));
		let firstFailedValidationResult = Helpers.getFirstFailedValidationResult(validationResults);
		if (firstFailedValidationResult) {
			Function
			return firstFailedValidationResult;
		}
		return ValidationResult.ValidationResult.Successful;
	}

	private static getFirstFailedValidationResult(validationResults: IValidationResult[]): IValidationResult {
		return _.find(validationResults, (validationResult) => !validationResult.isSuccessful);
	}
}
