import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[1.3rem] border border-white/40 bg-white/70 px-4 py-3 text-base text-ink shadow-[0_12px_30px_rgba(8,20,38,0.07)] backdrop-blur-xl outline-none transition placeholder:text-slate/45 focus:border-copper/45 focus:bg-white/82 focus:ring-4 focus:ring-copper/10 md:text-sm",
        className
      )}
      {...props}
    />
  );
}
