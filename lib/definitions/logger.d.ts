interface ILogger {
	setLevel(level: string): void;
	fatal(formatStr: any, ...args): void;
	error(formatStr: any, ...args): void;
	warn(formatStr: any, ...args): void;
	info(formatStr: any, ...args): void;
	debug(formatStr: any, ...args): void;
	trace(formatStr: any, ...args): void;

	out(formatStr: any, ...args): void;
	write(...args): void;
}