///<reference path="../.d.ts"/>
"use strict";

import util = require("util");

export class TSTypeSystemHelpers implements Swagger.ITsTypeSystemHelpers {
	private static ARRAY_START_CHAR = "[";
	private static ARRAY_END_CHAR = "]";
	private static COMMA_CHAR = ",";

	private static NUMBER_TYPE_NAME = "number";
	private static ANY_TYPE_NAME = "any";
	private static STRING_TYPE_NAME = "string";

	private static BUILT_IN_TYPES = ["IDictionary", "boolean", "number", "string", "Date", "void", "ReadableStream", "WritableStream", "any"];
	private models: IDictionary<boolean> = Object.create(null);

	public getWritableStreamTypeName(): string {
		return TSTypeSystemHelpers.ANY_TYPE_NAME;
	}

	public getReadableStreamTypeName(): string {
		return TSTypeSystemHelpers.ANY_TYPE_NAME;
	}

	public translate(typeName: string): string {
		if(this.isNumber(typeName)) {
			return TSTypeSystemHelpers.NUMBER_TYPE_NAME;
		}

		if(this.isGeneric(typeName)) {
			return TSTypeSystemHelpers.ANY_TYPE_NAME;
		}

		if(this.isMap(typeName)) {
			return this.translateMap(typeName);
		}

		let match = /List\[(.+)\]/.exec(typeName);
		if(match) {
			return this.translate(match[1]) + "[]";
		}

		return typeName;
	}

	public isGeneric(typeName: string): boolean {
		return typeName.indexOf("<") > 0;
	}

	public isBuiltIn(typeName: string): boolean {
		return !!_.find(TSTypeSystemHelpers.BUILT_IN_TYPES, (builtInType: string) => _.startsWith(typeName, builtInType));
	}

	public isModel(modelName: string): boolean {
		return !!this.models[modelName] ||
			(modelName.length > 2 && !!this.models[modelName.substr(0, modelName.length - 2)]);
	}

	public isStream(typeName: string): boolean {
		let tsTypeName = this.translate(typeName);
		return _.endsWith(tsTypeName, "Stream") || _.endsWith(tsTypeName, "file");
	}

	public addModel(modelName: string): void {
		this.models[modelName] = true;
	}

	private isNumber(typeName: string): boolean {
		return typeName === "int" || typeName === "long" || typeName === "double" || typeName === "float";
	}

	private isMap(typeName: string): boolean {
		return _.startsWith(typeName, "Map");
	}

	private translateMap(typeName: string): string {
		let keyStartIndex = typeName.indexOf(TSTypeSystemHelpers.ARRAY_START_CHAR) + 1;
		let keyValueSeparatorIndex = typeName.indexOf(TSTypeSystemHelpers.COMMA_CHAR);
		let key = typeName.substr(keyStartIndex, keyValueSeparatorIndex - keyStartIndex);
		if(key !== TSTypeSystemHelpers.STRING_TYPE_NAME) {
			return TSTypeSystemHelpers.ANY_TYPE_NAME;
		} else {
			let value = typeName.substr(keyValueSeparatorIndex + 1, typeName.indexOf(TSTypeSystemHelpers.ARRAY_END_CHAR) - keyValueSeparatorIndex - 1);
			return util.format("IDictionary<%s>", this.translate(value));
		}
	}
}