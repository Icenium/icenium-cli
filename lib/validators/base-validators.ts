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

export class BaseAsyncValidator<Input> implements IAsyncValidator<Input> {
	constructor(private $injector: IInjector) { }

	public async throwIfInvalid(data: Input): Promise<void> {
			let validationResult: IValidationResult = await  this.validate(data);
			if (!validationResult.isSuccessful) {
				this.$injector.resolve("$errors").fail(validationResult.error);
			}
	}

	public validate(data: Input): IFuture<IValidationResult> {
		return (() => ValidationResult.ValidationResult.Successful).future<IValidationResult>()();
	}

	public validateProperty(data: Input, propertyName: string): IFuture<IValidationResult> {
		return (() => ValidationResult.ValidationResult.Successful).future<IValidationResult>()();
	}
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

	public async static validateAsync(validators: Function[]): Promise<IValidationResult> {
			let validationResults = await  <IValidationResult[]>_.map(validators, (validator) => validator());
			let firstFailedValidationResult = Helpers.getFirstFailedValidationResult(validationResults);
			if (firstFailedValidationResult) {
				return firstFailedValidationResult;
			}
			return ValidationResult.ValidationResult.Successful;
	}

	private static getFirstFailedValidationResult(validationResults: IValidationResult[]): IValidationResult {
		return _.find(validationResults, (validationResult) => !validationResult.isSuccessful);
	}
}
