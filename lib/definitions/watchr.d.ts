declare module "watchr" {
	export interface IWatchData {
		path?: string;
		paths?: string[];
		listeners: {
			error: (error: string) => void;
			change: (changeType, filePath) => void;
		};
	}

	export function watch(arg: IWatchData);
}
