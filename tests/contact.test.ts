import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isValidEmailAddress,
  mailtoHref,
  normalizePhoneNumber,
  telHref,
} from '../lib/contact';

void test('contact email validation accepts ordinary mailbox addresses', () => {
  assert.equal(isValidEmailAddress('buyer@example.com'), true);
  assert.equal(isValidEmailAddress('sales.team+cars@jfcars.co.ao'), true);
});

void test('contact email validation rejects URI delimiters and malformed domains', () => {
  assert.equal(
    isValidEmailAddress('victim@example.com?bcc=attacker%40evil.com'),
    false,
  );
  assert.equal(
    isValidEmailAddress('buyer@example.com%0d%0abcc@example.org'),
    false,
  );
  assert.equal(isValidEmailAddress('buyer@-example.com'), false);
  assert.equal(isValidEmailAddress('.buyer@example.com'), false);
  assert.equal(isValidEmailAddress('buyer.@example.com'), false);
  assert.equal(isValidEmailAddress('buyer..cars@example.com'), false);
});

void test('contact email links encode the mailbox as a mailto path', () => {
  assert.equal(
    mailtoHref('buyer+cars@example.com'),
    'mailto:buyer+cars@example.com',
  );
  assert.equal(mailtoHref('buyer@example.com?bcc=evil@example.org'), 'mailto:');
});

void test('phone contacts reject dial commands and yield safe tel links', () => {
  assert.equal(normalizePhoneNumber('+244 912 345 678'), '+244 912 345 678');
  assert.equal(telHref('+244 (912) 345-678'), 'tel:+244912345678');
  assert.equal(normalizePhoneNumber('*21*5551234#'), '');
  assert.equal(normalizePhoneNumber('5551234;ext=9'), '');
  assert.equal(telHref('5551234?body=hello'), 'tel:');
});
