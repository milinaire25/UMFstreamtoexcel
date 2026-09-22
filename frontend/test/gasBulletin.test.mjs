import test from 'node:test';
import assert from 'node:assert/strict';
import { gasBulletinRows, quoteAge, STALE_QUOTE_MS } from '../src/gasBulletin.mjs';

const now = Date.parse('2026-09-22T10:00:00Z');
const message = (text, sender = 'broker@example.com', timestamp = now - 8000) => ({
  eventData: { message: text, createAt: new Date(timestamp).toISOString() },
  additionalData: { userId: sender },
});

test('bulletin extracts requested rows, prices, sizes, sender and expanded season names', () => {
  const rows = gasBulletinRows([message('TTF\nNov 32.38/47\nDec 33.12/22\nQ1 34.25/35\nSum27 29.80/30.10\n20mw')]);
  assert.deepEqual(rows.map(row => [row.contract, row.bid, row.ask, row.quantity]), [
    ['Nov-26',32.38,32.47,20], ['Dec-26',33.12,33.22,20], ['Q1-27',34.25,34.35,20], ['Summer-27',29.80,30.10,20],
  ]);
  assert.ok(rows.every(row => row.sender === 'broker@example.com'));
  assert.equal(quoteAge(rows[0].timestamp, now).label, '8 sec');
});

test('age ticks across minutes and warning threshold even without new messages', () => {
  assert.deepEqual(quoteAge(now - 12000, now), { label:'12 sec', stale:false });
  assert.deepEqual(quoteAge(now - 18000, now), { label:'18 sec', stale:false });
  assert.deepEqual(quoteAge(now, now + STALE_QUOTE_MS - 1), { label:'3 min', stale:false });
  assert.deepEqual(quoteAge(now, now + STALE_QUOTE_MS), { label:'4 min', stale:true });
  assert.deepEqual(quoteAge(now, now + 3600000), { label:'1 hr', stale:true });
  assert.deepEqual(quoteAge(null, now), { label:'—', stale:false });
  assert.deepEqual(quoteAge(now + 1000, now), { label:'0 sec', stale:false });
});

test('each sender keeps their own latest quote without mixing bid/ask or refreshing old replays', () => {
  const old = message('Nov26 32.35/50', 'a@example.com', now - 300000);
  const newer = message('Nov26 32.34/49?', 'a@example.com');
  const other = message('Nov26 32.38/47', 'b@example.com');
  const rows = gasBulletinRows([old, newer, other, old]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].bid,32.34);
  assert.equal(rows[0].unconfirmed,true);
  assert.equal(rows[0].quantity,null);
  assert.equal(rows[0].timestamp,now - 8000);
  assert.equal(rows[1].sender,'b@example.com');
});

test('TTF board excludes NBP and unrelated chat while supporting default TTF', () => {
  const rows = gasBulletinRows([message('NBP\nNov 80.10/20'), message('hello'), message('Win27 33.70/34.00')]);
  assert.equal(rows.length,1);
  assert.equal(rows[0].contract,'Winter-27');
  assert.equal(rows[0].inferredProduct,true);
});
