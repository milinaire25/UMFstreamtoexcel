import test from 'node:test';
import assert from 'node:assert/strict';
import { gasPrices, parseGasMessage, gasMarkets } from '../src/gas.mjs';
const first = `TTF
Oct 31.80/95
Nov 32.35/50
Dec 33.10/25
Q1 34.20/40
Sum27 29.80/30.10
Win27 33.70/34.00
10mw months, 20 seasons`;
const second = `Nov 32.38/47
Dec 33.12/22
Q1 34.25/35
20mw`;
const msg = (sender, text, time = '2026-09-22T10:00:00Z', room = 'room-1') => ({
  eventData: { message: text, createAt: time, chatRoomId: room }, additionalData: { userId: sender, chatRoomName: room },
});

test('parses all six Broker 1 contracts and only assigns sizes in stated scope', () => {
  const rows = parseGasMessage(msg('Broker 1', first));
  assert.deepEqual(rows.map(row => row.contract), ['Oct-26', 'Nov-26', 'Dec-26', 'Q1-27', 'Sum-27', 'Win-27']);
  assert.deepEqual(rows.map(row => [row.bid, row.ask]), [[31.80,31.95],[32.35,32.50],[33.10,33.25],[34.20,34.40],[29.80,30.10],[33.70,34.00]]);
  assert.deepEqual(rows.map(row => row.quantity), [10,10,10,null,20,20]);
  assert.equal(rows[0].inferredProduct, false);
  assert.equal(rows[0].inferredYear, true);
  assert.equal(rows[4].inferredYear, false);
});

test('combines the supplied brokers into exactly the requested November market', () => {
  const markets = gasMarkets([msg('Broker 1', first), msg('Broker 2', second)]);
  const november = markets.find(market => market.contract === 'Nov-26');
  assert.equal(markets.length, 6);
  assert.deepEqual(november.brokers.map(row => [row.sender, row.bid, row.ask, row.quantity]), [
    ['Broker 1',32.35,32.50,10], ['Broker 2',32.38,32.47,20],
  ]);
  assert.equal(november.bestBid, 32.38);
  assert.equal(november.bestAsk, 32.47);
  assert.equal(november.brokers[1].inferredProduct, true);
});

test('selects best sides independently even when they belong to different brokers', () => {
  const [market] = gasMarkets([msg('A','Nov 32.40/60'),msg('B','Nov 32.30/45')]);
  assert.equal(market.bestBid,32.40);
  assert.equal(market.bestAsk,32.45);
});

test('latest sender quote replaces both sides; replay and late arrival cannot restore stale prices', () => {
  const old = msg('A','Nov 32.35/50');
  const latest = msg('A','Nov 32.30/55','2026-09-22T11:00:00Z');
  const [market] = gasMarkets([old,latest,old]);
  assert.equal(market.brokers.length,1);
  assert.equal(market.bestBid,32.30);
  assert.equal(market.bestAsk,32.55);
});

test('combines brokers across chat rooms while keeping products separate', () => {
  const markets = gasMarkets([msg('A','TTF\nNov 32.35/50'),msg('B','NBP\nNov 80.10/20'),msg('C','Nov 32.40/60',undefined,'other-room')]);
  assert.equal(markets.length,2);
  assert.equal(markets.find(market => market.product === 'TTF').brokers.length,2);
  assert.equal(markets.find(market => market.product === 'NBP').brokers.length,1);
});

test('explicit years persist; omitted periods roll using message date, not current clock', () => {
  const rows = parseGasMessage(msg('A','Jan 31.80/95\nNov26 32.35/50\nQ1 34.20/40\nSum 29.80/30.10','2026-12-22T10:00:00Z'));
  assert.deepEqual(rows.map(row => row.contract),['Jan-27','Nov-26','Q1-27','Sum-27']);
});

test('unresolved product or year is displayed without a combined best market', () => {
  const [year] = gasMarkets([msg('A','Nov 32.35/50')],{inferYears:false});
  assert.equal(year.contract,'Nov (year unspecified)');
  assert.equal(year.bestBid,null);
  const [product] = gasMarkets([msg('A','Nov26 32.35/50')],{defaultProduct:''});
  assert.equal(product.product,'Unspecified product');
  assert.equal(product.bestAsk,null);
});

test('handles abbreviated ask rollover and keeps fully specified crossed quotes intact', () => {
  assert.deepEqual(gasPrices('31.95','05'),{bid:31.95,ask:32.05});
  assert.deepEqual(gasPrices('32.35','32.30'),{bid:32.35,ask:32.30});
  assert.deepEqual(gasPrices('32','33'),{bid:32,ask:33});
});

test('ignores unrelated chat, preserves inline sizes, and does not merge unknown senders', () => {
  assert.equal(parseGasMessage(msg('A','hello\n7.63% NCD Google bond MD 20/08/2028 8.60 offer')).length,0);
  assert.equal(parseGasMessage(msg('A','TTF Nov-2026 32.35/50 5mw\n20mw'))[0].quantity,5);
  assert.equal(parseGasMessage({message:'Nov 32.35/50'}).length,0);
});


test('accepts the reported spaced-year quote with a question mark and retains its status', () => {
  const [row] = parseGasMessage(msg('broker2@example.com', 'TTF Nov 26 32.34/49?'));
  assert.equal(row.product, 'TTF');
  assert.equal(row.contract, 'Nov-26');
  assert.equal(row.bid, 32.34);
  assert.equal(row.ask, 32.49);
  assert.equal(row.unconfirmed, true);
  assert.equal(row.inferredYear, false);
  assert.equal(row.inferredProduct, false);
});

test('question quote appears alongside broker 1; repeated posts stay one sender row', () => {
  const [market] = gasMarkets([
    msg('Broker 1', 'TTF Nov26 32.35/50'),
    msg('Broker 2', 'TTF Nov 26 32.34/49?', '2026-09-22T17:34:42Z'),
    msg('Broker 2', 'TTF Nov 26 32.34/49?', '2026-09-22T17:35:11Z'),
    msg('Broker 2', 'TTF Nov 26 32.34/49?', '2026-09-22T17:36:35Z', 'other-room'),
  ]);
  assert.equal(market.brokers.length, 2);
  assert.equal(market.bestBid, 32.35);
  assert.equal(market.bestAsk, 32.49);
  assert.equal(market.brokers[1].timestamp, Date.parse('2026-09-22T17:36:35Z'));
  assert.equal(market.brokers[1].unconfirmed, true);
});

test('accepts spaced and full-width question marks without accepting arbitrary trailing text', () => {
  for (const text of ['TTF Nov 26 32.34/49 ?', 'TTF Nov 26 32.34/49？？', 'TTF Nov 26 32.34/49 20mw?']) {
    assert.equal(parseGasMessage(msg('A', text))[0].unconfirmed, true);
  }
  assert.equal(parseGasMessage(msg('A', 'TTF Nov 26 32.34/49 withdrawn?')).length, 0);
  assert.equal(parseGasMessage(msg('A', 'TTF Nov 26 32.34/49'))[0].unconfirmed, false);
});
