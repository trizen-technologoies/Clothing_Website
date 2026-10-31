import { brand } from "./brand";

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats an amount in minor units (cents) as a price string. */
export function formatPrice(amount: number, currency: string = brand.currency) {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(brand.locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(amount / 100);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
