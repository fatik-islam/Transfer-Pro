export function SummaryStrip(props: {
  items: Array<{ label: string; value: string; detail: string }>;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.items.map((item) => (
        <article key={item.label} className="page-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">{item.label}</p>
          <p className="mt-4 text-3xl font-semibold text-ink md:text-4xl">{item.value}</p>
          <p className="mt-3 text-sm leading-7 text-slate">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
