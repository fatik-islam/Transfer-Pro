import "server-only";

import { createClient } from "@insforge/sdk";

function readConfig() {
  const baseUrl = process.env.INSFORGE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  return {
    baseUrl,
    anonKey
  };
}

export function isInsForgeConfigured() {
  const { baseUrl, anonKey } = readConfig();
  return Boolean(baseUrl && anonKey);
}

export function createInsForgeServerClient(accessToken?: string) {
  const { baseUrl, anonKey } = readConfig();

  if (!baseUrl || !anonKey) {
    throw new Error(
      "InsForge is not configured. Set INSFORGE_URL and INSFORGE_ANON_KEY in .env.local."
    );
  }

  return createClient({
    baseUrl,
    anonKey,
    edgeFunctionToken: accessToken,
    isServerMode: true,
    autoRefreshToken: false
  });
}

export async function unwrapInsForgeResult<T>(
  promise: PromiseLike<{ data: T; error: { message?: string } | null }>,
  label: string
) {
  const result = await promise;

  if (result.error) {
    throw new Error(`${label}: ${result.error.message ?? "Unknown InsForge error"}`);
  }

  return result.data;
}
