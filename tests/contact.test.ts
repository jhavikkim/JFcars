import assert from 'node:assert/strict';
import test from 'node:test';
import { JFCARS_EMAILS, JFCARS_PARENT_BRAND } from '../lib/brand';
import {
  isValidEmailAddress,
  mailtoHref,
  normalizePhoneNumber,
  normalizeWhatsAppNumber,
  telHref,
  whatsappHref,
} from '../lib/contact';

void test('JFcars uses the Justandfun mailbox family for each responsibility', () => {
  assert.equal(JFCARS_PARENT_BRAND, 'Justandfun');
  assert.deepEqual(JFCARS_EMAILS, {
    primary: 'jfcars@justandfun.com',
    contact: 'contact@justandfun.com',
    info: 'infos@justandfun.com',
    sales: 'sales@justandfun.com',
    noReply: 'noreply@justandfun.com',
  });
  for (const email of Object.values(JFCARS_EMAILS))
    assert.equal(isValidEmailAddress(email), true);
});

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

void test('WhatsApp links use digits only and safely encode a message', () => {
  assert.equal(normalizeWhatsAppNumber('+244 912 345 678'), '+244 912 345 678');
  assert.equal(normalizeWhatsAppNumber('+1234567890123456'), '');
  assert.equal(
    whatsappHref('+244 (912) 345-678', 'Hello JFcars — BMW X5'),
    'https://wa.me/244912345678?text=Hello%20JFcars%20%E2%80%94%20BMW%20X5',
  );
  assert.equal(whatsappHref('5551234?body=hello', 'Unsafe'), '');
});
