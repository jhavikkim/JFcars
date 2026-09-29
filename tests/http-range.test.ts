import assert from 'node:assert/strict';
import test from 'node:test';

import { parseByteRange } from '../lib/http-range';

void test('byte ranges support closed, open and suffix requests', () => {
  assert.deepEqual(parseByteRange('bytes=10-19', 100), {
    offset: 10,
    length: 10,
  });
  assert.deepEqual(parseByteRange('bytes=90-', 100), {
    offset: 90,
    length: 10,
  });
  assert.deepEqual(parseByteRange('bytes=-10', 100), {
    offset: 90,
    length: 10,
  });
});

void test('byte ranges clamp end and suffix to the stored object', () => {
  assert.deepEqual(parseByteRange('bytes=95-200', 100), {
    offset: 95,
    length: 5,
  });
  assert.deepEqual(parseByteRange('bytes=-200', 100), {
    offset: 0,
    length: 100,
  });
});

void test('byte ranges reject malformed, multiple and unsatisfied requests', () => {
  for (const value of [
    'items=0-1',
    'bytes=-',
    'bytes=10-9',
    'bytes=100-101',
    'bytes=0-1,4-5',
    'bytes=-0',
  ]) {
    assert.equal(parseByteRange(value, 100), null, value);
  }
});
