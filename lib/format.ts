import type { Decimal } from "@prisma/client/runtime/library";

export function formatMoney(value: bigint | number | string) {
  return new Intl.NumberFormat("zh-CN").format(Number(value));
}

export function formatOdds(value?: Decimal | string | number | null) {
  if (value === null || value === undefined) return "-";
  return Number(value.toString()).toFixed(2);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false
  }).format(date);
}

export function toDateTimeLocalValue(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function beijingDateTimeLocalToDate(value: string) {
  return new Date(`${value}:00+08:00`);
}
