///<reference path=".d.ts"/>

import Future = require("fibers/future");
import prompt = require("prompt");

export class Prompter implements IPrompter {
	constructor() {
		prompt.message = "";
		prompt.delimiter = ":";
		prompt.colors = false;
		prompt.isDefaultValueEditable = true;
	}

	public start() {
		prompt.start();
	}

	public get(schema: IPromptSchema): IFuture<any> {
		var future = new Future;
		prompt.get(schema, (err: Error, result: any) => {
			if (err) {
				future.throw(err);
			} else {
				future.return(result);
			}
		});
		return future;
	}

	public getPassword(prompt: string, options?: {allowEmpty?: boolean}): IFuture<string> {
		return (() => {
			var schema: IPromptSchema = {
				properties: {
					password: {
						description: prompt,
						type: "string",
						hidden: true,
						required: !(options && options.allowEmpty),
						message: "Password must be non-empty."
					}
				}
			};

			var result = this.get(schema).wait();
			return result.password;
		}).future<string>()();
	}

	public confirm(prompt: string, defaultAction?: () => string): IFuture<boolean> {
		return ((): boolean => {
			var schema: IPromptSchema = {
				properties: {
					password: {
						description: prompt + " (y/n)",
						type: "string",
						required: true,
						message: "Enter 'y' (for yes) or 'n' (for no).",
						conform: (value: string) => /^[yn]$/i.test(value),
					}
				}
			};

			if(defaultAction) {
				schema["properties"]["password"]["default"] = defaultAction;
			}

			var result = this.get(schema).wait();
			return result.password.toLowerCase() === "y";
		}).future<boolean>()();
	}

	public history(name: string): IPromptHistoryValue {
		return prompt.history(name);
	}

	public override(object: any): void {
		prompt.override = object;
	}
}
$injector.register("prompter", Prompter);