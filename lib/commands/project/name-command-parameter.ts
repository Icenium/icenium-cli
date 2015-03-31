///<reference path="../../.d.ts"/>
"use strict";

export class NameParameter implements ICommandParameter {
	constructor(private $projectNameValidator: IProjectNameValidator) { }
	mandatory = true;
	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(validationValue) {
				return this.$projectNameValidator.validate(validationValue);
			}

			return false;
		}).future<boolean>()();
	}
}
$injector.register("nameCommandParameter", NameParameter);