import test from 'node:test';
import assert from 'node:assert/strict';
import {moneyMarketRows,parseMoneyMarket,MONEY_MARKET_TENORS} from '../src/moneyMarket.mjs';
import {moneyMarketSample,sampleMoneyMarketMessage} from '../src/pages/moneyMarketSamples.mjs';
import {recentMessages} from '../src/recentMessages.mjs';
const msg=(text,time=1000000)=>({_receivedAt:new Date(time).toISOString(),eventData:{message:text,createAt:new Date(time).toISOString()},additionalData:{userId:'sender@example.com'}});

test('exact Provider2 screenshot fills only Bank 2 in the required tenor order',()=>{
 const rows=moneyMarketRows([sampleMoneyMarketMessage()]);
 assert.deepEqual(rows.map(r=>r.tenor),MONEY_MARKET_TENORS);
 assert.deepEqual(rows.map(r=>r.banks[1].rate),[1.22,1.24,1.25,1.26,1.28,1.30,1.32,1.34,1.35,1.37,1.39,1.40,1.42,1.43,1.45,1.47]);
 assert.ok(rows.every(r=>r.banks[0]===null&&r.banks[2]===null&&r.banks[3]===null));
});
test('bank updates remain independent, partial quotes preserve other tenors and late quotes cannot overwrite newer rates',()=>{
 const original=msg(moneyMarketSample);
 const bank1=msg('BANK: Bank1\nTENOR SGD\nON 0.95%');
 const update=msg('BANK: Provider2\nTENOR SGD\nON 1.55%',1001000);
 const rows=moneyMarketRows([original,bank1,update,original]);
 assert.equal(rows[0].banks[0].rate,.95);
 assert.equal(rows[0].banks[1].rate,1.55);
 assert.equal(rows[1].banks[1].rate,1.24);
});
test('aliases, case, numeric precision, negative rates and UMF separators are parsed without altering source',()=>{
 const text='BANK: ?Provider3\r\nTENOR\u00a0?SGD\r\nO/N ???1.2345%\r\n1w -0.05%\r\n2-Month 0%\r\n1Y 2.30';
 const input=msg(text);const before=JSON.stringify(input);const quotes=parseMoneyMarket(input);
 assert.deepEqual(quotes.map(q=>[q.tenor,q.rate]),[['O/N',1.2345],['1W',-.05],['2M',0],['1Y',2.3]]);
 assert.equal(JSON.stringify(input),before);assert.ok(quotes.every(q=>q.source===text&&q.bank===3));
});
test('missing, unknown and conflicting headers cannot assign a bank or currency',()=>{
 for(const text of ['ON 1.2%','BANK: Provider5\nTENOR SGD\nON 1.2%','BANK: Provider2\nTENOR USD\nON 1.2%','BANK: Provider2\nBANK: Provider3\nTENOR SGD\nON 1.2%','BANK: Provider2\nTENOR SGD\nCURRENCY USD\nON 1.2%','TTF Nov 32.38/47']) assert.deepEqual(parseMoneyMarket(msg(text)),[]);
});
test('malformed rates and unsupported tenors do not produce misleading values',()=>{
 assert.deepEqual(parseMoneyMarket(msg('BANK: Provider2\nTENOR SGD\nON 1.?22%\n1W 1?25%\n2W 1.2/1.3\n4W 2%\n12M 3%')),[]);
 assert.deepEqual(parseMoneyMarket(msg('BANK: Provider2\nTENOR SGD\nON 1.2%\nON 1.3%')),[]);
});
test('expiry clears only expired bank cells and retains the table layout',()=>{
 const old=msg(moneyMarketSample,1000),fresh=msg('BANK: Provider4\nTENOR SGD\nON 2%',180000);
 const rows=moneyMarketRows(recentMessages([old,fresh],181000));
 assert.equal(rows.length,16);assert.equal(rows[0].banks[1],null);assert.equal(rows[0].banks[3].rate,2);
 assert.ok(moneyMarketRows([]).every(r=>r.banks.every(q=>q===null)));
});
