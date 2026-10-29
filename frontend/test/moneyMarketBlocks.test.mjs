import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMoneyMarket,moneyMarketRows} from '../src/moneyMarket.mjs';
import {recentMessages} from '../src/recentMessages.mjs';
import {moneyMarketCopy} from '../src/moneyMarketExport.mjs';
// Rates and section order transcribed from the supplied UMF payload, with no IDs or email retained.
const expected = [
 [1.22,1.24,1.25,1.26,1.28,1.30,1.32,1.34,1.35,1.37,1.39,1.40,1.42,1.43,1.45,1.47],
 [1.25,1.26,1.28,1.29,1.31,1.33,1.35,1.37,1.38,1.40,1.42,1.44,1.45,1.47,1.49,1.51],
 [1.23,1.25,1.27,1.28,1.30,1.32,1.34,1.36,1.37,1.39,1.41,1.43,1.44,1.46,1.48,1.50],
 [1.26,1.27,1.29,1.30,1.32,1.34,1.36,1.38,1.40,1.42,1.43,1.45,1.47,1.49,1.51,1.53],
];
const tenorLabels=['ON','1-Week','2-Week','3-Week',...Array.from({length:11},(_,i)=>`${i+1}-Month`),'1-Year'];
const sections=expected.map((rates,i)=>`BANK: Provider${i+1}\nTENOR SGD\n`+rates.map((rate,j)=>`${tenorLabels[j]} ${rate.toFixed(2)}%`).join('\n'));
const source=sections.join('\n');
const msg=(message=source,time=1000000)=>({eventData:{message,createAt:new Date(time).toISOString()},_receivedAt:new Date(time).toISOString(),additionalData:{userId:'sender@example.com'}});

test('actual four consecutive BANK sections populate all 64 correct bank rates',()=>{
 const payload=msg();const original=JSON.stringify(payload);const quotes=parseMoneyMarket(payload);
 assert.equal(quotes.length,64);
 const rows=moneyMarketRows([payload]);
 for(let bank=0;bank<4;bank++) assert.deepEqual(rows.map(row=>row.banks[bank].rate),expected[bank]);
 assert.ok(quotes.every(q=>q.source===source&&q.sender==='sender@example.com'));
 assert.equal(JSON.stringify(payload),original);
});
test('section order, blank lines and UMF separators do not determine bank identity',()=>{
 const reordered=[sections[3],sections[0],sections[2],sections[1]].join('\n\n').replaceAll('TENOR SGD','TENOR ?SGD').replaceAll('ON ','ON ???');
 const rows=moneyMarketRows([msg(reordered)]);
 assert.deepEqual(rows[0].banks.map(q=>q.rate),expected.map(r=>r[0]));
});
test('bank and currency declarations cannot leak between sections',()=>{
 for(const broken of [sections[1].replace('TENOR SGD\n',''),sections[1].replace('SGD','USD'),sections[1].replace('Provider2','Provider5')]) {
  assert.deepEqual(parseMoneyMarket(msg(sections[0]+'\n'+broken)),[]);
 }
 assert.deepEqual(parseMoneyMarket(msg(sections[0]+'\n'+sections[0].replace('1.22%','9.99%'))),[]);
});
test('per-bank updates, full-table copy and expiry work with a combined section payload',()=>{
 const newer=msg('BANK: Provider2\nTENOR SGD\nON 2.00%',1001000);
 const rows=moneyMarketRows([msg(),newer,msg()]);
 assert.deepEqual(rows[0].banks.map(q=>q.rate),[1.22,2,1.23,1.26]);
 assert.equal(rows[1].banks[1].rate,1.26);
 assert.equal(parseMoneyMarket(msg(moneyMarketCopy(rows).text)).length,64);
 const expired=moneyMarketRows(recentMessages([msg(),newer],1180000));
 assert.deepEqual(expired[0].banks.map(q=>q?.rate),[undefined,2,undefined,undefined]);
});
