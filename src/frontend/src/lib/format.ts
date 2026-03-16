export function formatCurrency(cents: bigint | number): string {
  const n = typeof cents === "bigint" ? Number(cents) : cents;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n / 100);
}

export function formatDate(ts: bigint | number): string {
  const ms = typeof ts === "bigint" ? Number(ts) / 1_000_000 : ts;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function dateToNano(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export function today(): bigint {
  return dateToNano(new Date());
}
