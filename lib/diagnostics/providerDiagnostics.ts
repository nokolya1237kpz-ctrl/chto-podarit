export type ProviderDiagnostic = {
  provider: string;
  query?: string;
  url?: string;
  stage:
    | 'build_url'
    | 'fetch'
    | 'parse_json'
    | 'parse_html'
    | 'normalize'
    | 'quality_gate'
    | 'dedupe'
    | 'save';
  status: 'success' | 'warning' | 'error';
  httpStatus?: number;
  foundRaw?: number;
  normalized?: number;
  activeReady?: number;
  draftReady?: number;
  skipped?: number;
  error?: string;
  details?: any;
};

export type ProviderSearchResult<T> = {
  products: T[];
  diagnostics: ProviderDiagnostic[];
};

export function diagnostic(input: ProviderDiagnostic): ProviderDiagnostic {
  return input;
}

export function countQuality(products: Array<{ title?: string; imageUrl?: string; price?: number }>) {
  let activeReady = 0;
  let draftReady = 0;
  let skipped = 0;

  for (const product of products) {
    if (!product.title) {
      skipped += 1;
    } else if (product.title && product.imageUrl && Number(product.price || 0) > 0) {
      activeReady += 1;
    } else {
      draftReady += 1;
    }
  }

  return { activeReady, draftReady, skipped };
}
