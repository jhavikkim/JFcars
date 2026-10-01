import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accessibilityCopy,
  compactMoney,
  convertFromXaf,
  convertToXaf,
  copy,
  currencyLabel,
  footerCopy,
  isCurrency,
  localeFor,
  marketCopy,
  money,
  profileCopy,
  supportedCurrencies,
  ui,
} from '../components/jfcars/config';

void test('Portuguese for Angola is present across shared storefront copy', () => {
  assert.equal(localeFor('pt'), 'pt-AO');
  assert.equal(copy.pt.buy, 'Comprar');
  assert.ok(ui.pt.partsDemand.length > 0);
  assert.ok(marketCopy.pt.locationGroup.length > 0);
  assert.ok(footerCopy.pt.contact.length > 0);
  assert.ok(profileCopy.pt.settings.length > 0);
  assert.ok(accessibilityCopy.pt.language.length > 0);
});

void test('only the four supported display currencies are accepted', () => {
  assert.deepEqual(supportedCurrencies, ['XAF', 'USD', 'EUR', 'AOA']);
  for (const currency of supportedCurrencies)
    assert.equal(isCurrency(currency), true);
  assert.equal(isCurrency('BTC'), false);
  assert.equal(isCurrency('xaf'), false);
  assert.equal(isCurrency(undefined), false);
});

void test('currency labels and formatted amounts are unambiguous', () => {
  assert.equal(currencyLabel('XAF'), 'FCFA · XAF');
  assert.equal(currencyLabel('USD'), 'US$ · USD');
  assert.equal(currencyLabel('EUR'), '€ · EUR');
  assert.equal(currencyLabel('AOA'), 'Kz · AOA');

  assert.match(money(20_000_000, 'fr', 'XAF'), /FCFA/);
  assert.match(money(20_000_000, 'en', 'USD'), /US\$/);
  assert.match(money(20_000_000, 'pt', 'EUR'), /€/);
  assert.match(money(20_000_000, 'pt', 'AOA'), /Kz/);
  assert.match(compactMoney(20_000_000, 'pt', 'AOA'), /Kz/);
});

void test('display conversion round-trips without changing canonical XAF values', () => {
  const canonicalAmounts = [30_000, 60_000, 15_000_000, 20_000_000];
  for (const currency of supportedCurrencies) {
    for (const amount of canonicalAmounts) {
      const displayed = convertFromXaf(amount, currency);
      const roundTripped = convertToXaf(displayed, currency);
      assert.ok(Math.abs(roundTripped - amount) <= 1);
    }
  }
});

void test('live rate snapshots override the bundled display conversion', () => {
  const liveRates = {
    XAF: 1,
    USD: 500,
    EUR: 650,
    AOA: 0.625,
  } as const;
  assert.equal(convertFromXaf(1_000, 'USD', liveRates), 2);
  assert.equal(convertToXaf(2, 'USD', liveRates), 1_000);
  assert.match(money(1_000, 'en', 'USD', liveRates), /2\.00/);
});
