import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BodyTooLargeError,
  parsePositiveInteger,
  readResponseText,
  validateAffiliateUrl
} from './check-affiliates.mjs';

test('validateAffiliateUrl accepts approved HTTPS destinations', function () {
  const url = 'https://a.r10.to/example';
  assert.equal(validateAffiliateUrl(url), url);
  assert.equal(validateAffiliateUrl(''), '');
});

test('validateAffiliateUrl rejects unapproved or insecure destinations', function () {
  assert.throws(
    () => validateAffiliateUrl('https://example.com/item'),
    /approved HTTPS affiliate URL/
  );
  assert.throws(
    () => validateAffiliateUrl('http://a.r10.to/example'),
    /approved HTTPS affiliate URL/
  );
});

test('readResponseText returns a body within the configured limit', async function () {
  const response = new Response('在庫あり');
  assert.equal(await readResponseText(response, 64), '在庫あり');
});

test('readResponseText rejects a declared body larger than the limit', async function () {
  const response = new Response('small', {
    headers: { 'content-length': '1000' }
  });

  await assert.rejects(
    readResponseText(response, 16),
    BodyTooLargeError
  );
});

test('readResponseText stops a streamed body at the byte limit', async function () {
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(10));
      controller.enqueue(new Uint8Array(10));
      controller.close();
    }
  }));

  await assert.rejects(
    readResponseText(response, 12),
    BodyTooLargeError
  );
});

test('parsePositiveInteger enforces its upper bound', function () {
  assert.equal(parsePositiveInteger('', 5, 10), 5);
  assert.equal(parsePositiveInteger('7', 5, 10), 7);
  assert.throws(() => parsePositiveInteger('11', 5, 10), /between 1 and 10/);
});
