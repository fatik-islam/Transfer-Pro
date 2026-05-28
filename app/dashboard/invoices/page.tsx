import { redirect } from "next/navigation";

import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { requireSession } from "@/lib/auth";
import { getInvoices } from "@/lib/repository";

export default async function DashboardInvoicesPage() {
  const session = await requireSession();

  if (session.role === "DRIVER") {
    redirect("/dashboard");
  }

  const invoices = await getInvoices(session);
  const heading = session.role === "CUSTOMER" ? "Receipts" : "Invoices";
  const subheading =
    session.role === "CUSTOMER"
      ? "Paid trip receipts and downloadable PDF records."
      : "Payment records and downloadable PDF invoices and receipts.";

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">{heading}</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          {subheading}
        </h1>
      </div>
      <InvoicesTable invoices={invoices} />
    </section>
  );
}
