import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { getCustomers } from "@/lib/repository";

export default async function DashboardCustomersPage() {
  const session = await requireSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const customers = await getCustomers();

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Customers</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Accounts, booking history, and repeat-business visibility.
        </h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {customers.map((customer) => (
          <article key={customer.id} className="rounded-[2rem] bg-white p-6 shadow-quiet">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Customer account</p>
            <h2 className="mt-4 text-2xl font-semibold text-ink md:text-3xl">{customer.name}</h2>
            <p className="mt-4 text-sm text-slate">{customer.email}</p>
            {customer.phone ? <p className="mt-2 text-sm text-slate">{customer.phone}</p> : null}
            {customer.companyName ? (
              <p className="mt-2 text-sm text-slate">Company: {customer.companyName}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
