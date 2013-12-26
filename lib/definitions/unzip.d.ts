interface IUnzipOptions {
	path: string;
}

declare module "unzip" {

	function Extract(opts: IUnzipOptions): WritableStream;
}