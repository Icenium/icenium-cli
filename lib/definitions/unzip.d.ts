interface IUnzipOptions {
	path: string;
}

declare class ZipEntry extends ReadableStream {
	path: string;
	type: string;
	size: number;

	autodrain(): void;
}

declare module "unzip" {
	function Extract(opts: IUnzipOptions): WritableStream;
	function Parse(): WritableStream;
}