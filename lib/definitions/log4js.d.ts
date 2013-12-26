declare module "log4js" {
	interface ILogger {
		fatal(formatStr: string, ...args): void;
		error(formatStr: string, ...args): void;
		warn(formatStr: string, ...args): void;
		info(formatStr: string, ...args): void;
		debug(formatStr: string, ...args): void;
		trace(formatStr: string, ...args): void;

		setLevel(level: string): void;
	}

	interface IConfiguration {
		appenders: any[];
	}

	function configure(conf: IConfiguration): void;
	function getLogger(categoryName?: string): ILogger;
}
