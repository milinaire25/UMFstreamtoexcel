import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMessageText } from '../../shared/messageText.mjs';
import { parseBondQuote } from '../src/bonds.mjs';
import { parseGasMessage } from '../src/gas.mjs';
import { gasBulletinRows } from '../src/gasBulletin.mjs';
import { powerRows } from '../src/power.mjs';

test('shared normalization handles UMF separators without mutating quotes or questions', () => {
  assert.equal(normalizeMessageText('Q127 NSW 87.80/ ???in ?3'), 'Q127 NSW 87.80/ in 3');
  for (const text of ['Is this firm?', 'Why ???now', 'TTF Nov 32.34/49?', 'Q127 NSW 87.?80/ in 3', 'Q127 NSW 87.80/ ?88 in 3', 'Q127 NSW 87.80/ in 3?5']) assert.equal(normalizeMessageText(text), text);
  assert.equal(normalizeMessageText('TTF\r\nNov\u00a0?26 32.38/47'), 'TTF\nNov 26 32.38/47');
});

test('all structured views parse the same separator artifacts and preserve source', () => {
  const bond = parseBondQuote('7.63% ?NCD ?Google bond ?MD ?20/08/2028 ?8.60 offer');
  assert.equal(bond?.issuer, 'Google');
  assert.equal(bond?.offerPrice, '8.60');
  const message = { eventData: {message:'TTF ?Nov ?26 32.38/47 ?20mw?', createAt:'2026-09-28T07:48:07Z'},additionalData:{userId:'broker@example.com'} };
  const gas = parseGasMessage(message);
  assert.equal(gas.length, 1);
  assert.deepEqual([gas[0].bid,gas[0].ask,gas[0].quantity,gas[0].unconfirmed], [32.38,32.47,20,true]);
  assert.equal(gas[0].source, message.eventData.message);
  assert.equal(gasBulletinRows([message]).length, 1);
  const power = powerRows([{...message,eventData:{...message.eventData,message:'Fy 29 ?vic 82.75/ ???in ?3'}}]);
  assert.equal(power[0]?.size, '3');
});
