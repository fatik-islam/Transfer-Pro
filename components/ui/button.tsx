import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold tracking-[0.08em] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "border-[#102133] bg-[#102133] text-[#f4efe7] shadow-lift backdrop-blur-xl hover:bg-[#183049] hover:shadow-quiet",
        variant === "secondary" &&
          "border-white/58 bg-white/88 text-ink shadow-[0_16px_38px_rgba(8,20,38,0.09)] backdrop-blur-xl hover:border-copper/42 hover:bg-white/96 hover:text-copper",
        variant === "ghost" &&
          "border-white/34 bg-white/68 text-ink shadow-[0_12px_30px_rgba(8,20,38,0.06)] backdrop-blur-lg hover:bg-white/86 hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
