import test from 'node:test';
import assert from 'node:assert/strict';
import { recentMessages, MESSAGE_VISIBLE_MS } from '../src/recentMessages.mjs';
import { gasMarkets } from '../src/gas.mjs';
import { gasBulletinRows } from '../src/gasBulletin.mjs';
import { latestBonds } from '../src/bonds.mjs';
const now = Date.parse('2026-09-23T10:00:00Z');
const msg = (age, text = 'TTF Nov26 32.38/47', sender = 'broker@example.com') => ({
  _receivedAt: new Date(now - age).toISOString(),
  eventData: { message: text, createAt: new Date(now - age).toISOString() },
  additionalData: { userId: sender },
});
test('expires exactly at three minutes without needing another incoming message', () => {
  const message = msg(0);
  assert.equal(recentMessages([message], now + MESSAGE_VISIBLE_MS - 1).length, 1);
  assert.equal(recentMessages([message], now + MESSAGE_VISIBLE_MS).length, 0);
});
test('old buffered replay remains hidden; newly received identical text reappears', () => {
  const old = msg(180000), fresh = msg(0);
  assert.deepEqual(recentMessages([old,old,fresh], now), [fresh]);
});
test('server receipt time takes priority over sender time, with valid creation fallback', () => {
  const message = msg(0); message.eventData.createAt = new Date(now - 600000).toISOString();
  assert.equal(recentMessages([message], now).length, 1);
  delete message._receivedAt;
  assert.equal(recentMessages([message], now).length, 0);
  message.eventData.createAt = new Date(now).toISOString();
  assert.equal(recentMessages([message], now).length, 1);
  assert.equal(recentMessages([{message:'unknown time'}],now).length, 0);
});
test('GAS and bulletin remove expired brokers and recalculate best market', () => {
  const visible = recentMessages([msg(180000,'TTF Nov26 32.40/45','old'),msg(1000)],now);
  const [market] = gasMarkets(visible);
  assert.equal(market.brokers.length,1);
  assert.equal(market.bestBid,32.38);
  assert.equal(market.bestAsk,32.47);
  assert.equal(gasBulletinRows(visible).length,1);
  assert.deepEqual(gasMarkets(recentMessages(visible,now + 180000)),[]);
});
test('Bonds only displays messages within the same three-minute window', () => {
  const text = '7.63% NCD Google bond MD 20/08/2028 8.60 offer';
  assert.equal(latestBonds(recentMessages([msg(180000,text),msg(1000,text)],now)).length,1);
});
