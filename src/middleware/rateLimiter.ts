export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number = 60000; 

  constructor(maxRequestsPerMinute: number = 10) {
    this.maxRequests = maxRequestsPerMinute;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();

    let timestamps = this.requests.get(identifier) || [];

    timestamps = timestamps.filter((time) => now - time < this.windowMs);

    console.log(
      `[Rate Limiter] IP: ${identifier}, Requests in window: ${timestamps.length}/${this.maxRequests}`
    );

    if (timestamps.length >= this.maxRequests) {
      this.requests.set(identifier, timestamps);
      return false;
    }

    timestamps.push(now);
    this.requests.set(identifier, timestamps);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  clear(): void {
    this.requests.clear();
  }

  getRemainingRequests(identifier: string): number {
    const timestamps = this.requests.get(identifier) || [];
    const now = Date.now();
    const recentRequests = timestamps.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}
