export function delay(ms: number): Promise<unknown> {
  return new Promise(r => setTimeout(r, ms));
}
