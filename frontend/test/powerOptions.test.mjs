import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePowerOption, powerOptionRows } from '../src/powerOptions.mjs';
import { powerRows } from '../src/power.mjs';
import { sampleOptionMessages } from '../src/pages/powerOptionSamples.mjs';
import { recentMessages } from '../src/recentMessages.mjs';

test('exact samples separate five options from the flat contract, preserving successive quotes', () => {
  const messages = sampleOptionMessages();
  const rows = powerOptionRows(messages);
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map(r => [r.contract,r.product,r.bid,r.ask,r.size,r.structure]), [
    ['Q127 QLD','QLD',3.4,null,null,'PS'],
    ['Q127 QLD','QLD',3.25,null,null,'PS'],
    ['Q426 QLD','QLD',1.7,1.9,'25','PS'],
    ['Q426 QLD','QLD',null,.5,'25:50','Ratio CS'],
    ['CAL27 NSW','NSW',null,1.95,null,'CS'],
  ]);
  assert.deepEqual(powerRows(messages).map(r=>[r.contract,r.bid,r.size]), [['FY28 QLD',76.5,'3']]);
  assert.equal(rows[4].notes, 'BLK · x 7 at 87.25');
  assert.equal(rows[2].notes, '(naked bid / x 3 at 68.28)');
  assert.equal(rows[4].strikes, '90/100');
  assert.equal(rows[0].sender, 'sam@broker.example');
  assert.equal(new Set(rows.map(r=>r.key)).size, 5);
});

test('options accept UMF separators and text time without merging strike and premium fields', () => {
  const row = parsePowerOption('Q 127 qld 75/65 ps 3.25/ ???in ?5 08:36:38');
  assert.deepEqual([row.contract,row.strikes,row.bid,row.ask,row.size], ['Q127 QLD','75/65',3.25,null,'5']);
});

test('rejects unsupported or ambiguous options rather than inventing data', () => {
  for (const text of ['Q426 vic 30p 1.10/1.50 blk', 'Q426 QLD 95/105 Ratio CS /0.50 in 25:50', 'Q426 QLD 95/105 1x2 CS /0.50 in 25', 'Q127 QLD 75/65 PS 3.?25/ blk', 'Q127 QLD 75/65 PS / blk', 'Q127 QLD 75/65 PS 3.25/ in 3?5']) assert.equal(parsePowerOption(text), null, text);
});

test('multiline messages and three-minute receipt expiry retain original sources', () => {
  const messages = sampleOptionMessages(1000000);
  const before = JSON.stringify(messages);
  assert.equal(powerOptionRows(recentMessages(messages,1000000)).length,5);
  assert.equal(powerOptionRows(recentMessages(messages,1180000)).length,0);
  const combined = {...messages[0],eventData:{message:messages[0].eventData.message+'\n'+messages[1].eventData.message}};
  assert.equal(powerOptionRows([combined]).length,2);
  assert.equal(JSON.stringify(messages),before);
});

test('option structures handle UMF size separators and nonbreaking spaces across sample types', () => {
  for (const [source, bid, ask, size] of [
    ['Cal 27 NSW 90/100 CS: ... /1.95 ???in ?block x 7 at 87.25', null, 1.95, null],
    ['Q426 QLD 95/105 1x2 Ratio CS /0.50 ???in ?25:50', null, .5, '25:50'],
    ['Q426 QLD 60/55 PS 1.70/1.90 ???in ?25 (naked bid / x 3 at 68.28)', 1.7, 1.9, '25'],
    ['Q 127 qld 75/65 ps 3.25/ ???blk', 3.25, null, null],
    ['Q\u00a0127 qld 75/65 ps 3.40/\u202fblk', 3.4, null, null],
  ]) {
    const row = parsePowerOption(source);
    assert.ok(row, source);
    assert.deepEqual([row.bid,row.ask,row.size], [bid,ask,size]);
    assert.equal(row.source, source);
  }
});


test('requested columns preserve the explicit year, strike, structure and BLK notes', () => {
  const row = parsePowerOption('Q 125 Qld 75/65 ps 3.40/  blk');
  assert.deepEqual([row.contract,row.strikes,row.structure,row.bid,row.ask,row.size,row.notes],
    ['Q125 QLD','75/65','PS',3.4,null,null,'BLK']);
  const ratio = parsePowerOption('Q426 QLD 95/105 1x2 Ratio CS /0.50 in 25:50');
  assert.deepEqual([ratio.contract,ratio.strikes,ratio.structure,ratio.ratio,ratio.size,ratio.notes],
    ['Q426 QLD','95/105','Ratio CS','1x2','25:50','']);
});
