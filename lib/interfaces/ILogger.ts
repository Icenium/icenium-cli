///<reference path="../.d.ts"/>

module Interfaces {
	export interface ILogger {
		fatal(formatStr: string, ...args): void;
		error(formatStr: string, ...args): void;
		warn(formatStr: string, ...args): void;
		info(formatStr: string, ...args): void;
		debug(formatStr: string, ...args): void;
		trace(formatStr: string, ...args): void;
	}
}