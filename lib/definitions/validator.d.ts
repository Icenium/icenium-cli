declare module "validator" {
	export var email: string;
	export var url: string;
	export var creditCard: string;
	export var isbn10Maybe: string;
	export var isbn13Maybe: string;
	export var ipv4Maybe: string;
	export var ipv6: string;
	export var uuid: string;
	export var alpha: string;
	export var alphanumeric: string;
	export var numeric: string;
	export var int: string;
	export var float: string;
	export var hexadecimal: string;
	export var hexcolor: string;

	export function toString(input: any): string;
	export function toDate(date: any): Date;
	export function toFloat(str: string): number;
	export function toInt(str: string, radix?: number): number;
	export function toBoolean(str: string, strict?: boolean): boolean;
	export function equals(str: string, comparison: string): boolean;
	export function contains(str: any, elem: string): boolean;
	export function matches(str: string, pattern: string, modifiers?: string): boolean;
	export function isEmail(str: string): boolean;
	export function isURL(str: string): boolean;
	export function isIP(str: string, version?: string): boolean;
	export function isAlpha(str: string): boolean;
	export function isAlphanumeric(str: string): boolean;
	export function isNumeric(str: string): boolean;
	export function isHexadecimal(str: string): boolean;
	export function isHexColor(str: string): boolean;
	export function isLowercase(str: string): boolean;
	export function isUppercase(str: string): boolean;
	export function isInt(str: string): boolean;
	export function isFloat(str: string): boolean;
	export function isDivisibleBy(str: number, num: any): boolean;
	export function isNull(str: string): boolean;
	export function isLength(str: string, min?: number, max?: number): boolean;
	export function isUUID(str: string, version?: string): boolean;
	export function isDate(str: string): boolean;
	export function isAfter(str: string, date: string): boolean;
	export function isBefore(str: string, date: string): boolean;
	export function isIn(str: string, options: any): boolean;
	export function isCreditCard(str: string): boolean;
	export function isISBN(str: string, version?: string): boolean;
	export function ltrim(str: string, chars: string): boolean;
	export function rtrim(str: string, chars: string): boolean;
	export function trim(str: string, chars: string): boolean;
	export function escape(str: string): boolean;
	export function whitelist(str: string, chars: string): boolean;
	export function blacklist(str: string, chars: string): boolean;
}

interface IValidationResult {
	Error: string;
	IsSuccessful: boolean;
}

interface IValidator<Input> {
	throwIfInvalid(data: Input): void;
	validate(data: Input): IValidationResult;
	validateProperty(data: Input, propertyName: string): IValidationResult;
}

interface IAsyncValidator<Input> {
	throwIfInvalid(data: Input): IFuture<void>;
	validate(data: Input): IFuture<IValidationResult>;
	validateProperty(data: Input, propertyName: string): IFuture<IValidationResult>;
}

interface IiOSDeploymentValidatorModel {
	provisionOption: string;
	certificateOption: string;
}