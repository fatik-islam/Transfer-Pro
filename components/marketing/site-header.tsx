import { SiteHeaderClient } from "@/components/marketing/site-header-client";
import { getSession } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getSession();

  return <SiteHeaderClient hasSession={Boolean(session)} />;
}
