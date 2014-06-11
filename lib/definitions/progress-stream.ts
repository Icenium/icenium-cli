declare module "progress-stream" {
	function progressStream(options: IProgressStreamOptions, onProgress?: (progress: IProgressStreamReport) => void): ReadableStream;
	export = progressStream;
}

interface IProgressStreamOptions {
	time?: number;
	speed?: number;
	length?: number;
	drain?: boolean;
}

interface IProgressStreamReport{
	percentage: number;
	transferred: number;
	length: number;
	remaining: number;
	eta: number;
	runtime: number;
	delta: number;
	speed: number;
}