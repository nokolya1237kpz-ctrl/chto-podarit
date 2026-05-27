export const ASCII_USER_AGENT = 'ChtoPodaritBot/1.0 (+https://chto-podarit.online/contacts)';
export const ASCII_PRODUCT_METADATA_USER_AGENT = 'Mozilla/5.0 (compatible; ProductMetadataBot/1.0; +https://chto-podarit.online)';

export type HeaderSanitizeWarning = {
  header: string;
  originalValue: string;
  sanitizedValue: string;
};

function toAsciiHeaderValue(value: string) {
  return value.replace(/[^\x20-\x7E\t]/g, '');
}

export function sanitizeHeaders(headers: Record<string, string>) {
  const warnings: HeaderSanitizeWarning[] = [];
  const sanitized: Record<string, string> = {};

  Object.entries(headers).forEach(([key, value]) => {
    const nextValue = toAsciiHeaderValue(String(value));
    sanitized[key] = nextValue;
    if (nextValue !== value) {
      warnings.push({ header: key, originalValue: value, sanitizedValue: nextValue });
    }
  });

  return { headers: sanitized, warnings };
}
