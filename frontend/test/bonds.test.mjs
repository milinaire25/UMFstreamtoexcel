import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBondQuote, latestBonds } from '../src/bonds.mjs';

const example = '7.63% NCD Google bond MD 20/08/2028 8.60 offer';
const message = (i, text = example) => ({
  eventData: { message: text, createAt: `2026-09-22T10:${String(i).padStart(2, '0')}:00Z` },
  additionalData: { userId: 'sender@example.com' },
});

test('extracts the exact requested Google quote without losing price precision', () => {
  assert.deepEqual(parseBondQuote(example), {
    issuer: 'Google', coupon: '7.63%', instrument: 'NCD', maturity: '20/08/2028', offerPrice: '8.60',
  });
});

test('handles case, extra whitespace, multi-word issuers and labeled offer first', () => {
  assert.deepEqual(parseBondQuote('  7.63 % ncd Google Holdings bond maturity date: 2-8-2028 OFFER: 8.60  '), {
    issuer: 'Google Holdings', coupon: '7.63%', instrument: 'NCD', maturity: '02/08/2028', offerPrice: '8.60',
  });
});

test('missing offer stays empty and ordinary chat or ambiguous terms are excluded', () => {
  assert.equal(parseBondQuote('7.63% NCD Google MD 20/08/2028').offerPrice, '');
  for (const text of ['1', 'hello', 'Google 8.60 offer', example.replace('offer', 'bid'), example.replace('2028', '28'), example.replace('20/08', '31/02')]) {
    assert.equal(parseBondQuote(text), null, text);
  }
});

test('sorts by message time and caps matching messages at ten without mutating input', () => {
  const messages = Array.from({ length: 12 }, (_, i) => message(i));
  messages.reverse();
  messages.push(message(59, 'unrelated chat'));
  const before = JSON.stringify(messages);
  const rows = latestBonds(messages);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].timestamp, Date.parse('2026-09-22T10:11:00Z'));
  assert.equal(rows[9].timestamp, Date.parse('2026-09-22T10:02:00Z'));
  assert.equal(rows[0].sender, 'sender@example.com');
  assert.equal(JSON.stringify(messages), before);
});

test('new live quote replaces the oldest displayed quote', () => {
  const history = Array.from({ length: 10 }, (_, i) => message(i));
  const rows = latestBonds([...history, message(10)]);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].timestamp, Date.parse(message(10).eventData.createAt));
  assert.equal(rows[9].timestamp, Date.parse(message(1).eventData.createAt));
});

test('replayed payloads are skipped but separate identical-text messages are kept', () => {
  assert.equal(latestBonds([message(1), message(1), message(2)]).length, 2);
});

test('falls back to receipt time and user UUID without inventing missing metadata', () => {
  const [row] = latestBonds([{ eventData: { message: example, createAt: 'bad', userUuid: 'user-1' }, _receivedAt: '2026-09-22T10:00:00Z' }]);
  assert.equal(row.sender, 'user-1');
  assert.equal(row.timestamp, Date.parse('2026-09-22T10:00:00Z'));
  assert.equal(latestBonds([{ message: example }])[0].timestamp, null);
  assert.deepEqual(latestBonds([message(1, 'hello')]), []);
});
