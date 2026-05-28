import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const session = await requireSession();

  return <DashboardShell user={session}>{children}</DashboardShell>;
}
