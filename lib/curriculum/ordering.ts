export function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function sortByNumber<T extends { number: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.number - b.number);
}

export function assertUniqueOrder<T extends { order: number }>(items: T[], label: string): void {
  const orders = new Set<number>();
  for (const item of items) {
    if (orders.has(item.order)) throw new Error(`${label} has duplicate order ${item.order}`);
    orders.add(item.order);
  }
}
