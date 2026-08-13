export function formatPrice(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}

export function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
