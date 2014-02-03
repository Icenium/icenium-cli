///<reference path="../.d.ts"/>

"use strict";

export class ValidationResult implements IValidationResult {
	constructor(private error: string) { }

	public get Error(): string {
		return this.error;
	}

	public get IsSuccessful(): boolean {
		return !this.error;
	}
}
