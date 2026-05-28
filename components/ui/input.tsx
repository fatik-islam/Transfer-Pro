import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "block min-h-14 w-full min-w-0 appearance-none rounded-[1.3rem] border border-white/40 bg-white/70 px-5 py-3.5 text-base text-ink shadow-[0_12px_30px_rgba(8,20,38,0.07)] backdrop-blur-xl outline-none transition placeholder:text-slate/45 focus:border-copper/45 focus:bg-white/82 focus:ring-4 focus:ring-copper/10 md:text-[15px]",
        className
      )}
      {...props}
    />
  );
}
