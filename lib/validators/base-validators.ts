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

	public throwIfInvalid(data: Input): IFuture<void> {
		return (() => {
			let validationResult: IValidationResult = this.validate(data).wait();
			if (!validationResult.isSuccessful) {
				this.$injector.resolve("$errors").fail(validationResult.error);
			}
		}).future<void>()();
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

	public static validateAsync(validators: Function[]): IFuture<IValidationResult> {
		return (() => {
			let validationResults = <IValidationResult[]>_.map(validators, (validator) => validator().wait());
			let firstFailedValidationResult = Helpers.getFirstFailedValidationResult(validationResults);
			if (firstFailedValidationResult) {
				return firstFailedValidationResult;
			}
			return ValidationResult.ValidationResult.Successful;
		}).future<IValidationResult>()();
	}

	private static getFirstFailedValidationResult(validationResults: IValidationResult[]): IValidationResult {
		return _.find(validationResults, (validationResult) => !validationResult.isSuccessful);
	}
}
