import { Result, ok, error } from "./result";
import * as cp from "child_process";

export function spawnWithTimeout(
    command: string,
    args: string[],
    timeout: number): Promise<Result<{ stdout: string, stderr: string, exitCode: number }>> {
    const child = cp.spawn(command, args);
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    child.stdout.on('data', (chunk) => stdoutChunks.push(chunk.toString()));
    child.stderr.on('data', (chunk) => stderrChunks.push(chunk.toString()));
    return new Promise((resolve, reject) => {
        child.on('error', (err) => {
            clearTimeout(timeoutHandle);
            resolve(error(`Error spawning ${command}: ${err}`));
        });
        child.on('exit', (code) => {
            clearTimeout(timeoutHandle);
            resolve(ok({
                stdout: stdoutChunks.join(''),
                stderr: stderrChunks.join(''),
                exitCode: code ?? -1 // Really?
            }));
        });
        function timeoutHandler() {
            child.kill();
            resolve(error(`Timed out after ${timeout / 1000 }s`));
        }
        const timeoutHandle = setTimeout(timeoutHandler, timeout);
    });
}