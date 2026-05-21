import { sanitizeHeaders } from '@/lib/httpHeaders';

export type BrowserHeaderProfile = 'desktop_chrome' | 'safari_mac' | 'firefox' | 'mobile_chrome';

export type FetchReasonCode = 'rate_limit' | 'blocked' | 'timeout' | 'server_error' | 'network_error' | 'ok';

export type FetchWithRetryResult = {
  response?: Response;
  attempts: number;
  reason: FetchReasonCode;
  warnings: string[];
  error?: string;
};

const profileNames: BrowserHeaderProfile[] = ['desktop_chrome', 'safari_mac', 'firefox', 'mobile_chrome'];

function pickProfile(seed = ''): BrowserHeaderProfile {
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return profileNames[hash % profileNames.length] || 'desktop_chrome';
}

export function getBrowserHeaders(profile: BrowserHeaderProfile = 'desktop_chrome') {
  const common = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  };

  const profiles: Record<BrowserHeaderProfile, Record<string, string>> = {
    desktop_chrome: {
      ...common,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Sec-CH-UA': '"Chromium";v="125", "Google Chrome";v="125", "Not.A/Brand";v="24"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"macOS"',
    },
    safari_mac: {
      ...common,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    },
    firefox: {
      ...common,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0',
    },
    mobile_chrome: {
      ...common,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
      'Sec-CH-UA': '"Chromium";v="125", "Google Chrome";v="125", "Not.A/Brand";v="24"',
      'Sec-CH-UA-Mobile': '?1',
      'Sec-CH-UA-Platform': '"Android"',
    },
  };

  return sanitizeHeaders(profiles[profile]).headers;
}

export function getJsonHeaders(profile?: BrowserHeaderProfile) {
  return {
    ...getBrowserHeaders(profile),
    Accept: 'application/json,text/plain,*/*',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
  };
}

function reasonFromStatus(status: number): FetchReasonCode {
  if (status === 429) return 'rate_limit';
  if (status === 403 || status === 401) return 'blocked';
  if (status >= 500) return 'server_error';
  return 'ok';
}

function shouldRetry(status?: number) {
  return Boolean(status === 429 || (status && status >= 500));
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithAdaptiveRetry(
  url: string,
  init: RequestInit = {},
  options: { maxRetries?: number; baseDelayMs?: number; timeoutMs?: number; profile?: BrowserHeaderProfile } = {}
): Promise<FetchWithRetryResult> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 700;
  const warnings: string[] = [];
  let lastError = '';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);
    const profile = options.profile || pickProfile(`${url}:${attempt}`);
    const headers = sanitizeHeaders({
      ...getBrowserHeaders(profile),
      ...(init.headers as Record<string, string> | undefined),
    });
    if (headers.warnings.length) {
      warnings.push(...headers.warnings.map((warning) => `${warning.header} sanitized`));
    }

    try {
      const response = await fetch(url, {
        ...init,
        headers: headers.headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const reason = reasonFromStatus(response.status);
      if (!shouldRetry(response.status) || attempt === maxRetries) {
        return { response, attempts: attempt + 1, reason, warnings };
      }
      const jitter = Math.floor(Math.random() * 350);
      await wait(baseDelayMs * 2 ** attempt + jitter);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error.message : String(error);
      const reason: FetchReasonCode = lastError.toLowerCase().includes('abort') ? 'timeout' : 'network_error';
      if (attempt === maxRetries) {
        return { attempts: attempt + 1, reason, warnings, error: lastError };
      }
      const jitter = Math.floor(Math.random() * 350);
      await wait(baseDelayMs * 2 ** attempt + jitter);
    }
  }

  return { attempts: maxRetries + 1, reason: 'network_error', warnings, error: lastError || 'Unknown fetch error' };
}
