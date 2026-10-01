import type { Currency } from '@/lib/marketplace/types';

export type CurrencyRates = Readonly<Record<Currency, number>>;

export type ExchangeRateSnapshot = {
  base: 'XAF';
  rates: CurrencyRates;
  asOf: string;
  rateDates: Partial<Record<Currency, string>>;
  source: 'Frankfurter' | 'bundled-reference';
  live: boolean;
};

export const fallbackCurrencyRateDate = '2026-09-18';

export const fallbackXafPerCurrency: CurrencyRates = {
  XAF: 1,
  EUR: 655.957,
  USD: 655.957 / 1.146,
  AOA: 655.957 / 1046.796,
};

type FrankfurterRate = {
  date?: unknown;
  base?: unknown;
  quote?: unknown;
  rate?: unknown;
};

const datedRate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/**
 * Frankfurter's EUR-base response keeps the XAF peg at useful precision.
 * The returned values are normalized to the catalogue's canonical unit:
 * XAF required to buy one unit of each display currency.
 */
export function parseFrankfurterRates(value: unknown): ExchangeRateSnapshot {
  if (!Array.isArray(value)) throw new Error('Invalid exchange-rate response');

  const rows = new Map<Currency, { rate: number; date: string }>();
  for (const candidate of value as FrankfurterRate[]) {
    const quote = candidate.quote;
    const rate = Number(candidate.rate);
    if (
      candidate.base === 'EUR' &&
      (quote === 'XAF' || quote === 'USD' || quote === 'AOA') &&
      Number.isFinite(rate) &&
      rate > 0 &&
      datedRate(candidate.date)
    ) {
      rows.set(quote, { rate, date: candidate.date });
    }
  }

  const xaf = rows.get('XAF');
  const usd = rows.get('USD');
  const aoa = rows.get('AOA');
  if (!xaf || !usd || !aoa)
    throw new Error('Exchange-rate response is incomplete');

  const dates = [xaf.date, usd.date, aoa.date].sort();
  return {
    base: 'XAF',
    rates: {
      XAF: 1,
      EUR: xaf.rate,
      USD: xaf.rate / usd.rate,
      AOA: xaf.rate / aoa.rate,
    },
    // Use the oldest component date so the UI never overstates freshness when
    // different central-bank sources publish on different schedules.
    asOf: dates[0] || fallbackCurrencyRateDate,
    rateDates: {
      XAF: xaf.date,
      EUR: xaf.date,
      USD: usd.date,
      AOA: aoa.date,
    },
    source: 'Frankfurter',
    live: true,
  };
}

export function fallbackExchangeRates(): ExchangeRateSnapshot {
  return {
    base: 'XAF',
    rates: fallbackXafPerCurrency,
    asOf: fallbackCurrencyRateDate,
    rateDates: {
      XAF: fallbackCurrencyRateDate,
      EUR: fallbackCurrencyRateDate,
      USD: fallbackCurrencyRateDate,
      AOA: fallbackCurrencyRateDate,
    },
    source: 'bundled-reference',
    live: false,
  };
}

export function isExchangeRateSnapshot(
  value: unknown,
): value is ExchangeRateSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ExchangeRateSnapshot>;
  const rates = candidate.rates as Partial<Record<Currency, unknown>> | undefined;
  return (
    candidate.base === 'XAF' &&
    typeof candidate.asOf === 'string' &&
    datedRate(candidate.asOf) &&
    (candidate.source === 'Frankfurter' ||
      candidate.source === 'bundled-reference') &&
    typeof candidate.live === 'boolean' &&
    Boolean(rates) &&
    (['XAF', 'USD', 'EUR', 'AOA'] as const).every((currency) => {
      const rate = Number(rates?.[currency]);
      return Number.isFinite(rate) && rate > 0;
    })
  );
}
