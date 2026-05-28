import { useId } from "react";

import { brand } from "@/lib/site-data";
import { cn } from "@/lib/utils";

type TransferProLogoProps = {
  className?: string;
  emblemClassName?: string;
  nameClassName?: string;
  taglineClassName?: string;
  compact?: boolean;
  showTagline?: boolean;
};

export function TransferProLogo({
  className,
  emblemClassName,
  nameClassName,
  taglineClassName,
  compact = false,
  showTagline = true
}: TransferProLogoProps) {
  const gradientId = useId();

  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2.5", className)}>
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className={cn(
          "shrink-0 rounded-full shadow-[0_16px_32px_rgba(5,21,48,0.18)]",
          compact ? "h-11 w-11" : "h-14 w-14",
          emblemClassName
        )}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f4d389" />
            <stop offset="100%" stopColor="#c9953f" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="#071b3a" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={`url(#${gradientId})`} strokeWidth="3.5" />
        <circle cx="60" cy="60" r="48" fill="none" stroke={`url(#${gradientId})`} strokeOpacity="0.9" strokeWidth="1.5" />
        <text
          x="35"
          y="71"
          fill={`url(#${gradientId})`}
          fontFamily="Cormorant Garamond, Baskerville, Times New Roman, serif"
          fontSize="56"
          fontWeight="700"
        >
          T
        </text>
        <text
          x="50"
          y="84"
          fill="#f6efe2"
          fontFamily="Cormorant Garamond, Baskerville, Times New Roman, serif"
          fontSize="56"
          fontWeight="500"
        >
          P
        </text>
        <path d="M40 90H54" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeWidth="2" />
        <path d="M66 90H80" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeWidth="2" />
        <path d="M60 84L62.5 88.5L67 90L62.5 91.5L60 96L57.5 91.5L53 90L57.5 88.5L60 84Z" fill={`url(#${gradientId})`} />
      </svg>

      <span className="min-w-0">
        <span
          className={cn(
            "block font-display text-base uppercase tracking-[0.24em] text-[#10233f] sm:text-lg",
            compact && "text-sm tracking-[0.22em] sm:text-base",
            nameClassName
          )}
        >
          Transfer <span className="text-[#c9953f]">Pro</span>
        </span>
        {showTagline ? (
          <span
            className={cn(
              "block text-[10px] uppercase tracking-[0.34em] text-[#b68137] sm:text-[11px]",
              compact && "text-[9px] tracking-[0.28em] sm:text-[10px]",
              taglineClassName
            )}
          >
            {brand.tagline}
          </span>
        ) : null}
      </span>
    </div>
  );
}
