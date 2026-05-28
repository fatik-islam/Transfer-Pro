import { cn, statusTone } from "@/lib/utils";

export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        statusTone(value)
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
