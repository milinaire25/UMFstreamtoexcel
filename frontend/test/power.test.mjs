import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePowerLine, powerRows } from '../src/power.mjs';
import { recentMessages } from '../src/recentMessages.mjs';

test('screenshot flat quotes, one-sided quotes, case and spacing', () => {
  for (const [text, contract, bid, ask, size] of [
    ['Fy 29 Vic 82.75 / in 3 10:08:33', 'FY29 VIC', 82.75, null, '3'],
    ['Q127 NSW 87.80/ in 3 10:13:39', 'Q127 NSW',87.8,null,'3'],
    ['Q4 27 Vic 43.00 /44.25 in 5 10:18:15','Q427 VIC',43,44.25,'5'],
    ['cal 29 qld /84.05 in 2 10:22:10','CAL29 QLD',null,84.05,'2'],
    ['fy28 QLD: 76.50/ 3 08:35:01','FY28 QLD',76.5,null,'3'],
    ['Q4 27 Vic 43.25 /44.00 in 5','Q427 VIC',43.25,44,'5'],
  ]) {
    const row = parsePowerLine(text);
    assert.deepEqual([row.contract,row.bid,row.ask,row.size], [contract,bid,ask,size]);
  }
});

test('options and spread strikes never appear as flat quote prices', () => {
  for (const text of [
    'Cal 27 NSW 90/100 CS: ... / 1.95 in block x 7 at 87.25 08:25:09',
    'Q426 QLD 95/105 1x2 Ratio CS /0.50 in 25:50 08:33:26',
    'Q426 QLD 60/55 PS 1.70/1.90 in 25 (naked bid / x 3 at 68.28) 08:33:55',
    'Q 127 qld 75/65 ps 3.25/ blk',
    'Q127 QLD 75/65 ps 3.40/ blk',
    'Q426 VIC 40c 1.10/1.50 in 5',
    'Q426 VIC 1.10/1.50 call in 5',
  ]) assert.equal(parsePowerLine(text), null, text);
});

test('flat block sizes and text timestamps remain available', () => {
  const row = parsePowerLine('Q427 VIC 43/44 in block 10:25:43');
  assert.deepEqual([row.bid,row.ask,row.size,row.block,row.time],[43,44,null,true,'10:25:43']);
});

test('unsupported 30p and unrelated messages are ignored', () => {
  for (const text of ['Q426 vic 30p 1.10 / 1.50 blk 10:20:07','TTF Nov 32.38/47','Q127 NSW hello','Q127 NSW /']) assert.equal(parsePowerLine(text),null);
});

const message = (text, time) => ({_receivedAt:new Date(time).toISOString(),eventData:{message:text,createAt:'2020-01-01T00:00:00Z'},additionalData:{userId:'sender@example.com'}});
test('repeated and one-sided messages remain separate, newest first, with sender email', () => {
  const input = [message('Q427 VIC 43/44 in 5',1000),message('Q427 VIC /44 in 5',2000),message('Q427 VIC /44 in 5',3000)];
  const rows = powerRows(input);
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(row=>row.bid),[null,null,43]);
  assert.deepEqual(rows.map(row=>row.timestamp),[3000,2000,1000]);
  assert.ok(rows.every(row=>row.sender==='sender@example.com'));
  assert.equal(new Set(rows.map(row=>row.key)).size,3);
});
test('multiline quotes survive until three-minute receipt expiry without changing earlier rows', () => {
  const old = message('FY29 VIC 82.75/ in 3',1000);
  const fresh = message('Q127 NSW 87.80/ in 3\nCAL29 QLD /84.05 in 2',180000);
  assert.equal(powerRows(recentMessages([old,fresh],180999)).length,3);
  assert.equal(powerRows(recentMessages([old,fresh],181000)).length,2);
});


test('real UMF question-mark formatting parses a bid-only quote without inventing an ask', () => {
  const payload = {
    eventData: { message: 'Q127 NSW 87.80/ ???in ?3', createAt: '2026-09-28T07:48:07.687Z' },
    additionalData: { userId: 'sender@example.com' },
    _receivedAt: '2026-09-28T07:48:07.816Z',
  };
  const [row] = powerRows(recentMessages([payload], Date.parse('2026-09-28T07:48:08Z')));
  assert.ok(row);
  assert.deepEqual([row.contract, row.bid, row.ask, row.size, row.hasQuestionMarks], ['Q127 NSW', 87.8, null, '3', true]);
  assert.equal(row.source, payload.eventData.message);
  assert.equal(payload.eventData.message, 'Q127 NSW 87.80/ ???in ?3');
});

test('question marks are accepted around size terms but never joined into numbers or option prices', () => {
  for (const text of ['Fy 29 vic 82.75/ ???in ?3', 'Q127 NSW 87.80/???in ?3', 'Q127 NSW 87.80/ in 3?']) {
    const row = parsePowerLine(text);
    assert.ok(row, text);
    assert.equal(row.ask, null);
    assert.equal(row.size, '3');
    assert.equal(row.hasQuestionMarks, true);
  }
  for (const text of ['Q127 NSW 87.?80/ in 3', 'Q127 NSW 87.80/ in 3?5', 'Q127 NSW 87.80/ ?88 in 3', 'Q426 VIC 30p 1.10/1.50 ???blk', 'Q127 QLD 75/65 ?PS 3.25/ blk']) {
    assert.equal(parsePowerLine(text), null, text);
  }
  assert.equal(parsePowerLine('Q127 NSW 87.80/ in 3').hasQuestionMarks, false);
});
