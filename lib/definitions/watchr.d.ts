declare module "watchr" {
    export interface IWatchData {
        paths: string[];
        listeners: { error:(error: string) => void; change: (changeType, filePath) => void; next: (error, watchers) => void };
    }

    export function watch(arg: IWatchData);
}