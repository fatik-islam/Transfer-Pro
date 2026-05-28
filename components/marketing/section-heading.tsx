import type { ReactNode } from "react";

export function SectionHeading(props: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-copper">{props.eyebrow}</p>
        <h2 className="text-balance font-display text-[2.7rem] leading-[0.94] text-ink md:text-5xl">{props.title}</h2>
        <p className="max-w-xl text-[1.02rem] leading-8 text-slate">{props.body}</p>
      </div>
      {props.action}
    </div>
  );
}
