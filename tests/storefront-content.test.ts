import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeGalleryRecords } from '../lib/storefront-content';

const baseItem = {
  id: 'shipment-media-1',
  image: 'https://example.com/loading.mp4',
  status: 'loaded',
  date: '2026-09-22',
  location: 'Port of Antwerp',
  reference: 'JF-MEDIA-1',
  captions: { en: 'Loading complete' },
  comments: { en: 'Container checked' },
};

void test('gallery normalization preserves videos and defaults legacy records to images', () => {
  const normalized = normalizeGalleryRecords([
    { ...baseItem, mediaType: 'video' },
    {
      ...baseItem,
      id: 'legacy-photo-1',
      image: 'https://example.com/loading.webp',
    },
  ]);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0]?.mediaType, 'video');
  assert.equal(normalized[0]?.image, 'https://example.com/loading.mp4');
  assert.equal(normalized[1]?.mediaType, 'image');
});

void test('gallery normalization rejects unsupported media types', () => {
  assert.deepEqual(
    normalizeGalleryRecords([{ ...baseItem, mediaType: 'document' }]),
    [],
  );
});
