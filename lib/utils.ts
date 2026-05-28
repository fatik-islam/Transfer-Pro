import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function statusTone(value: string) {
  if (["CONFIRMED", "COMPLETED", "PAID", "ACCEPTED", "AVAILABLE"].includes(value)) {
    return "bg-emerald-500/12 text-emerald-700";
  }

  if (["PENDING", "PENDING_PAYMENT", "AUTHORIZED", "OFFER_SENT", "ON_TRIP", "IN_PROGRESS", "ARRIVED"].includes(value)) {
    return "bg-amber-500/12 text-amber-700";
  }

  if (value === "REFUNDED") {
    return "bg-sky-500/12 text-sky-700";
  }

  return "bg-slate-900/8 text-slate-600";
}

export function makeReference(prefix: string) {
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}
