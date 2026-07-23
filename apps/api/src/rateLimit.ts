export type RateLimitConfig = {
  perHour: number;
  perDay: number;
};

export type RateLimitResult =
  | { allowed: true; remainingHour: number; remainingDay: number }
  | { allowed: false; retryAfterSec: number };

type Bucket = { hour: number[]; day: number[] };

/**
 * Simple in-memory IP rate limiter (MVP).
 */
export class IpRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly config: RateLimitConfig) {}

  check(ip: string, now = Date.now()): RateLimitResult {
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    let b = this.buckets.get(ip);
    if (!b) {
      b = { hour: [], day: [] };
      this.buckets.set(ip, b);
    }
    b.hour = b.hour.filter((t) => now - t < hourMs);
    b.day = b.day.filter((t) => now - t < dayMs);

    if (b.hour.length >= this.config.perHour) {
      const oldest = b.hour[0] ?? now;
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((hourMs - (now - oldest)) / 1000)),
      };
    }
    if (b.day.length >= this.config.perDay) {
      const oldest = b.day[0] ?? now;
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((dayMs - (now - oldest)) / 1000)),
      };
    }

    b.hour.push(now);
    b.day.push(now);
    return {
      allowed: true,
      remainingHour: this.config.perHour - b.hour.length,
      remainingDay: this.config.perDay - b.day.length,
    };
  }

  /** Test helper */
  reset(): void {
    this.buckets.clear();
  }
}

export function rateLimitFromEnv(): RateLimitConfig {
  return {
    perHour: Number.parseInt(process.env.DOCWRIGHT_RATE_LIMIT_PER_HOUR ?? "5", 10) || 5,
    perDay: Number.parseInt(process.env.DOCWRIGHT_RATE_LIMIT_PER_DAY ?? "20", 10) || 20,
  };
}
