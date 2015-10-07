/*
    TODO: Fix in DefinitelyTyped, remove this file, remove reference from tsconfig.node.json

    Pull requests:
      https://github.com/borisyankov/DefinitelyTyped/pull/6185
*/

declare module "child_process" {
    export function spawnSync(command: string, args?: string[], options?: {
        cwd?: string;
        input?: string | Buffer;
        stdio?: any;
        env?: any;
        uid?: number;
        gid?: number;
        timeout?: number;
        maxBuffer?: number;
        killSignal?: string;
        encoding?: string;
    }): {
            pid: number;
            output: string[];
            stdout: string | Buffer;
            stderr: string | Buffer;
            status: number;
            signal: string;
            error: Error;
        };
}
