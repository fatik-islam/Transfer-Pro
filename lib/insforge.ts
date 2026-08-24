import "server-only";

import { createClient } from "@insforge/sdk";

function readConfig() {
  const baseUrl = process.env.INSFORGE_URL;
  const serverKey = process.env.INSFORGE_API_KEY;

  return {
    baseUrl,
    serverKey
  };
}

export function isInsForgeConfigured() {
  const { baseUrl, serverKey } = readConfig();
  const configured = Boolean(baseUrl && serverKey);

  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("Transfer Pro database configuration is unavailable.");
  }

  return configured;
}

export function createInsForgeServerClient(accessToken?: string) {
  const { baseUrl, serverKey } = readConfig();

  if (!baseUrl || !serverKey) {
    throw new Error(
      "InsForge is not configured. Set INSFORGE_URL and INSFORGE_API_KEY in the server environment."
    );
  }

  return createClient({
    baseUrl,
    anonKey: serverKey,
    edgeFunctionToken: accessToken,
    isServerMode: true
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
