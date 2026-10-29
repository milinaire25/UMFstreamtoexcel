import test from 'node:test';
import assert from 'node:assert/strict';
import {moneyMarketRows,parseMoneyMarket,MONEY_MARKET_TENORS} from '../src/moneyMarket.mjs';
import {moneyMarketCopy} from '../src/moneyMarketExport.mjs';
const values = [
[1.23,1.22,1.25,1.26],[1.25,1.24,1.26,1.27],[1.27,1.25,1.28,1.29],[1.28,1.26,1.29,1.30],
[1.30,1.28,1.31,1.32],[1.32,1.30,1.33,1.34],[1.34,1.32,1.35,1.36],[1.36,1.34,1.37,1.38],
[1.37,1.35,1.38,1.40],[1.39,1.37,1.40,1.42],[1.41,1.39,1.42,1.43],[1.43,1.40,1.44,1.45],
[1.44,1.42,1.45,1.47],[1.46,1.43,1.47,1.49],[1.48,1.45,1.49,1.51],[1.50,1.47,1.51,1.53]];
const markdown = '| Currency / Tenor | SGD (rates %) | | | |\n| --- | --- | --- | --- | --- |\n| Tenor | Bank 1 | Bank 2 | Bank 3 | Bank 4 |\n'+values.map((rates,i)=>`| ${MONEY_MARKET_TENORS[i]} | ${rates.join(' | ')} |`).join('\n');
const msg=(message,time=1000000)=>({eventData:{message,createAt:new Date(time).toISOString()},additionalData:{userId:'sender@example.com'},_receivedAt:new Date(time).toISOString()});
test('one exact multi-bank message populates all 64 rates',()=>{
 const input=msg(markdown);const raw=JSON.stringify(input);const rows=moneyMarketRows([input]);
 assert.deepEqual(rows.map(r=>r.banks.map(c=>c?.rate)),values);
 assert.equal(parseMoneyMarket(input).length,64);assert.equal(JSON.stringify(input),raw);
});
test('copy table round trips TSV with blanks, zeros and negative rates',()=>{
 const rows=moneyMarketRows([msg(markdown)]);rows[0].banks[0]=null;rows[1].banks[2].rate=0;rows[2].banks[3].rate=-.125;
 const copied=moneyMarketCopy(rows).text;
 const roundtrip=moneyMarketRows([msg(copied)]);
 assert.deepEqual(roundtrip.map(r=>r.banks.map(c=>c?.rate)),rows.map(r=>r.banks.map(c=>c?.rate)));
});
test('explicit reordered bank headings control mapping and malformed rows never shift columns',()=>{
 const header='Currency / Tenor\tSGD (rates %)\t\t\t\nTenor\tBank 4\tBank 2\tBank 1\tBank 3\n';
 const rows=moneyMarketRows([msg(header+'O/N\t1.4\t\t1.1\t1.3\n1W\t1.4\t1.2\t1.1\n2W\t1.4\tbad\t1.1\t1.3')]);
 assert.deepEqual(rows[0].banks.map(c=>c?.rate),[1.1,undefined,1.3,1.4]);
 assert.ok(rows[1].banks.every(c=>c===null));assert.ok(rows[2].banks.every(c=>c===null));
});
test('single-bank updates still override only their own cells after a combined message',()=>{
 const rows=moneyMarketRows([msg(markdown),msg('BANK: Provider2\nTENOR SGD\nON 2.1%',1001000),msg(markdown)]);
 assert.deepEqual(rows[0].banks.map(c=>c.rate),[1.23,2.1,1.25,1.26]);assert.equal(rows[1].banks[1].rate,1.24);
});
test('reject unknown currency and ambiguous duplicate bank headers',()=>{
 assert.deepEqual(parseMoneyMarket(msg(markdown.replace('SGD','USD'))),[]);
 assert.deepEqual(parseMoneyMarket(msg(markdown.replace('Bank 4','Bank 2'))),[]);
});
test('UMF separators in cells do not alter rates or erase missing banks',()=>{
 const text='| Currency / Tenor | ?SGD (rates %) | | | |\n| Tenor | Bank 1 | Bank 2 | Bank 3 | Bank 4 |\n| O/N | ?1.23 | | 1.25% | 1.?26 |\n| 1W | ?1.25 | | ?1.26 | 1.27 |';
 const rows=moneyMarketRows([msg(text)]);
 assert.ok(rows[0].banks.every(c=>c===null));assert.deepEqual(rows[1].banks.map(c=>c?.rate),[1.25,undefined,1.26,1.27]);
});
