export function mapColumns<T extends Record<string, unknown>>(row: T, mapping: Record<string, string>) {
  return Object.entries(mapping).reduce<Record<string, unknown>>((acc, [target, source]) => {
    acc[target] = row[source];
    return acc;
  }, {});
}
