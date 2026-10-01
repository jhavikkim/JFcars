import {
  fallbackExchangeRates,
  parseFrankfurterRates,
  type ExchangeRateSnapshot,
} from '@/lib/exchange-rates';

export const dynamic = 'force-dynamic';

const providerUrl =
  'https://api.frankfurter.dev/v2/rates?base=EUR&quotes=XAF,USD,AOA';
const cacheTtlSeconds = 21_600;
const responseHeaders = {
  'Cache-Control':
    'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400',
};
const fallbackResponseHeaders = {
  'Cache-Control': 'public, max-age=30, s-maxage=300',
};

let cached:
  | { snapshot: ExchangeRateSnapshot; expiresAt: number }
  | undefined;

async function fetchLiveRates() {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.snapshot;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const init: RequestInit & {
      cf?: { cacheEverything: boolean; cacheTtl: number };
    } = {
      headers: { accept: 'application/json' },
      signal: controller.signal,
      cf: { cacheEverything: true, cacheTtl: cacheTtlSeconds },
    };
    const response = await fetch(providerUrl, init);
    if (!response.ok) throw new Error('Exchange-rate provider unavailable');
    const snapshot = parseFrankfurterRates(await response.json());
    cached = {
      snapshot,
      expiresAt: now + cacheTtlSeconds * 1_000,
    };
    return snapshot;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    return Response.json(await fetchLiveRates(), { headers: responseHeaders });
  } catch {
    return Response.json(fallbackExchangeRates(), {
      headers: fallbackResponseHeaders,
    });
  }
}
