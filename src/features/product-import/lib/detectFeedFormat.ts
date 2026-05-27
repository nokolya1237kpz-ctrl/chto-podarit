export function detectFeedFormat(input: string) {
  const sample = input.trim().slice(0, 200).toLowerCase();
  if (sample.startsWith('{') || sample.startsWith('[')) return 'json';
  if (sample.includes('<yml_catalog') || sample.includes('<offer')) return 'yml';
  if (sample.startsWith('<')) return 'xml';
  if (sample.includes(',') || sample.includes(';')) return 'csv';
  return 'unknown';
}
