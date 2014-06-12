declare module "filesize" {
	function filesize(bytes: number, options?: FileSizeOptions): string;
	function filesize(bytes: string, options?: FileSizeOptions): string;
	export = filesize;
}

interface FileSizeOptions {
	bits?: boolean;
	unix?: boolean;
	base?: number;
	round?: number;
	spacer?: string;
	suffixes?: any;
}