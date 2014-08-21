////<reference path="../.d.ts"/>
"use strict";

import ValidationResult = require("../common/validators/validation-result");

export class BaseValidator<Input> implements IValidator<Input> {
	public throwIfInvalid(data: Input): void {
		var validationResult: IValidationResult = this.validate(data);
		if (!validationResult.isSuccessful) {
			$injector.resolve("$errors").fail(validationResult.error);
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
	public throwIfInvalid(data: Input): IFuture<void> {
		return (() => {
			var validationResult: IValidationResult = this.validate(data).wait();
			if (!validationResult.isSuccessful) {
				$injector.resolve("$errors").fail(validationResult.error);
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
		var validationResults = <IValidationResult[]>_.map(validators, (validator) => validator());
		var firstFailedValidationResult = Helpers.getFirstFailedValidationResult(validationResults);
		if (firstFailedValidationResult) {
			return firstFailedValidationResult;
		}
		return ValidationResult.ValidationResult.Successful;
	}

	public static validateAsync(validators: Function[]): IFuture<IValidationResult> {
		return (() => {
			var validationResults = <IValidationResult[]>_.map(validators, (validator) => validator().wait());
			var firstFailedValidationResult = Helpers.getFirstFailedValidationResult(validationResults);
			if (firstFailedValidationResult) {
				return firstFailedValidationResult
			}
			return ValidationResult.ValidationResult.Successful;
		}).future<IValidationResult>()();
	}

	private static getFirstFailedValidationResult(validationResults: IValidationResult[]): IValidationResult {
		return _.find(validationResults, (validationResult) => !validationResult.isSuccessful);
	}
}