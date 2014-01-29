interface IPromptProperty {
	description?: string;
	type?: string;
	pattern?: RegExp;
	message?: string;
	hidden?: boolean;
	default?: () => string;
	required?: boolean;
	before?: (value: string) => string;
	conform?: (value: string) => boolean;
	completer?: (value: string) => any[];
}

interface IPromptProperties {
	[index: string]: IPromptProperty
}

interface IPromptSchema {
	properties: IPromptProperties
}

interface IPromptHistoryValue {
	value: any;
}

interface IPrompt {
	start(): void;
	get(properties: IPromptSchema, action: (err: Error, result: any) => any): void;
	message: string;
	delimiter: string;
	colors: boolean;
	isDefaultValueEditable: boolean;
	history(name: string): IPromptHistoryValue;
	override: any;
}

declare var cliPrompt: IPrompt;

declare module "prompt" {
	export = cliPrompt;
}
