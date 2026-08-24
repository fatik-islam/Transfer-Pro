import "server-only";

import { createHmac } from "crypto";
import { headers } from "next/headers";

import {
  createInsForgeServerClient,
  isInsForgeConfigured,
  unwrapInsForgeResult
} from "@/lib/insforge";

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many requests. Please wait before trying again.");
    this.name = "RateLimitError";
  }
}

type RateLimitOptions = {
  limit: number;
  windowSeconds: number;
  identifier?: string;
};

async function requestFingerprint(identifier?: string) {
  if (identifier) {
    return identifier.trim().toLowerCase();
  }

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 180) ?? "unknown-agent";
  return `${forwarded || realIp || "unknown-ip"}|${userAgent}`;
}

export async function enforceRateLimit(scope: string, options: RateLimitOptions) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const fingerprint = await requestFingerprint(options.identifier);
  const secret = process.env.RATE_LIMIT_SECRET?.trim() || process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error("RATE_LIMIT_SECRET or JWT_SECRET must be configured.");
  }

  const keyHash = createHmac("sha256", secret).update(fingerprint).digest("hex");
  const insforge = createInsForgeServerClient();
  const allowed = await unwrapInsForgeResult(
    insforge.database.rpc("consume_rate_limit", {
      p_scope: scope,
      p_key_hash: keyHash,
      p_window_seconds: options.windowSeconds,
      p_max_requests: options.limit
    }),
    `Rate limit ${scope}`
  );

  if (allowed !== true) {
    throw new RateLimitError(options.windowSeconds);
  }
}

export function rateLimitMessage(error: unknown) {
  return error instanceof RateLimitError
    ? "Too many attempts. Please wait a few minutes and try again."
    : null;
}
