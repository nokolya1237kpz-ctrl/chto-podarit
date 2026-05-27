import { importItemSchema, type ImportItemInput } from '../schema';

export function normalizeImportItem(input: unknown): ImportItemInput {
  return importItemSchema.parse(input);
}
