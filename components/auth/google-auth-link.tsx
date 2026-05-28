"use client";

import Link from "next/link";

export function GoogleAuthLink({ label }: { label: string }) {
  return (
    <Link
      href="/auth/google"
      className="glass-panel inline-flex w-full items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] text-ink transition hover:border-copper/30 hover:bg-white/82"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="#EA4335"
          d="M12 10.2v3.94h5.48c-.24 1.27-.96 2.35-2.04 3.08l3.3 2.56c1.92-1.77 3.03-4.37 3.03-7.45 0-.73-.07-1.43-.19-2.11H12Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.75 0 5.05-.91 6.73-2.47l-3.3-2.56c-.91.61-2.08.97-3.43.97-2.64 0-4.88-1.78-5.68-4.17l-3.42 2.64A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#4A90E2"
          d="M6.32 13.77A5.99 5.99 0 0 1 6 12c0-.62.11-1.22.32-1.77L2.9 7.6A10 10 0 0 0 2 12c0 1.6.38 3.12 1.06 4.46l3.26-2.69Z"
        />
        <path
          fill="#FBBC05"
          d="M12 6.06c1.5 0 2.85.51 3.91 1.5l2.94-2.94C17.04 2.93 14.75 2 12 2A10 10 0 0 0 3.06 7.54l3.26 2.69C7.12 7.84 9.36 6.06 12 6.06Z"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
