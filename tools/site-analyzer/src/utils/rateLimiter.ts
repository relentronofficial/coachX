/**
 * Polite, serialised rate limiter. Guarantees a minimum gap plus random jitter
 * between successive acquisitions so the crawler never bursts the target.
 */
export class RateLimiter {
  private last = 0;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly minDelayMs: number,
    private readonly maxJitterMs: number,
  ) {}

  /** Await the next allowed slot. Calls are serialised in arrival order. */
  acquire(): Promise<void> {
    this.chain = this.chain.then(() => this.waitTurn());
    return this.chain;
  }

  private async waitTurn(): Promise<void> {
    const now = Date.now();
    const jitter = Math.floor(Math.random() * (this.maxJitterMs + 1));
    const target = this.last + this.minDelayMs + jitter;
    const waitMs = Math.max(0, target - now);
    if (waitMs > 0) await sleep(waitMs);
    this.last = Date.now();
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
