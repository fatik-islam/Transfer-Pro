import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

async function check(name, configured, request) {
  if (!configured) {
    return { name, status: "not configured" };
  }

  try {
    const response = await request();
    return { name, status: response.ok ? "reachable" : `HTTP ${response.status}` };
  } catch {
    return { name, status: "unreachable" };
  }
}

const results = await Promise.all([
  check("Stripe", Boolean(process.env.STRIPE_SECRET_KEY), () =>
    fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(8000)
    })
  ),
  check("Google OAuth", Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), () =>
    fetch("https://accounts.google.com/.well-known/openid-configuration", {
      signal: AbortSignal.timeout(8000)
    })
  ),
  check("Resend", Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), () =>
    fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(8000)
    })
  ),
  Promise.resolve({
    name: "Twilio SMS",
    status:
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER
        ? "configured"
        : "not configured"
  }),
  Promise.resolve({
    name: "WhatsApp",
    status:
      process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
        ? "configured"
        : "not configured"
  }),
  Promise.resolve({
    name: "Google Routes",
    status: process.env.GOOGLE_MAPS_API_KEY ? "configured" : "optional fallback active"
  })
]);

for (const result of results) {
  console.log(`${result.name}: ${result.status}`);
}

if (results.some((result) => result.status === "unreachable" || result.status.startsWith("HTTP"))) {
  process.exitCode = 1;
}
