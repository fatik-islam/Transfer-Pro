import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-[1.3rem] border border-white/40 bg-white/70 px-4 py-3 text-base text-ink shadow-[0_12px_30px_rgba(8,20,38,0.07)] backdrop-blur-xl outline-none transition focus:border-copper/45 focus:bg-white/82 focus:ring-4 focus:ring-copper/10 md:text-sm",
        className
      )}
      {...props}
    />
  );
}
