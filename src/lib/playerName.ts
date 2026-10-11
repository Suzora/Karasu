/** The player as the detection surfaces name it: the process without Windows' `.exe`. */
export function playerName(process: string): string {
  return process.replace(/\.exe$/i, "");
}
