import { SectionHeading } from "@/components/marketing/section-heading";
import { buildMetadata } from "@/lib/seo";
import { workflowSteps } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: "How it works",
  description: "Booking, policies, direct driver updates, and payment workflow for Transfer Pro private transfers.",
  path: "/how-it-works"
});

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <SectionHeading
        eyebrow="Workflow"
        title="Clear policies before a private ride is confirmed."
        body="Waiting time, cancellation, child seats, airport pickup, late-night rides, direct contact, and payment terms are visible before the customer commits."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {workflowSteps.map((step, index) => (
          <article key={step.title} className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Step 0{index + 1}</p>
            <h2 className="mt-4 text-3xl font-semibold text-ink">{step.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate">{step.copy}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
