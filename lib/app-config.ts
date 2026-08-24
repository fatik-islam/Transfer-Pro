export const productionAppUrl = "https://transferpro.ca";

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configured) {
    return productionAppUrl;
  }

  try {
    return new URL(/^https?:\/\//i.test(configured) ? configured : `https://${configured}`).origin;
  } catch {
    return productionAppUrl;
  }
}
