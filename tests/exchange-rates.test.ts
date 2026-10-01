import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fallbackExchangeRates,
  isExchangeRateSnapshot,
  parseFrankfurterRates,
} from '../lib/exchange-rates';

const providerResponse = [
  { date: '2026-10-01', base: 'EUR', quote: 'AOA', rate: 1042.48 },
  { date: '2026-10-02', base: 'EUR', quote: 'USD', rate: 1.1343 },
  { date: '2026-10-01', base: 'EUR', quote: 'XAF', rate: 655.91 },
];

void test('normalizes EUR-based provider rates into XAF-per-currency values', () => {
  const snapshot = parseFrankfurterRates(providerResponse);
  assert.equal(snapshot.base, 'XAF');
  assert.equal(snapshot.asOf, '2026-10-01');
  assert.equal(snapshot.rates.XAF, 1);
  assert.equal(snapshot.rates.EUR, 655.91);
  assert.ok(Math.abs(snapshot.rates.USD - 578.250903641012) < 0.000001);
  assert.ok(Math.abs(snapshot.rates.AOA - 0.6291823344332744) < 0.000001);
  assert.equal(snapshot.live, true);
  assert.equal(isExchangeRateSnapshot(snapshot), true);
});

void test('rejects incomplete or unsafe provider responses', () => {
  assert.throws(() => parseFrankfurterRates(providerResponse.slice(1)));
  assert.throws(() =>
    parseFrankfurterRates(
      providerResponse.map((row) =>
        row.quote === 'USD' ? { ...row, rate: 0 } : row,
      ),
    ),
  );
});

void test('bundled fallback is complete and marked non-live', () => {
  const snapshot = fallbackExchangeRates();
  assert.equal(snapshot.live, false);
  assert.equal(snapshot.source, 'bundled-reference');
  assert.equal(isExchangeRateSnapshot(snapshot), true);
});
