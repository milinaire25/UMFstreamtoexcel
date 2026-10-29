import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {moneyMarketRows} from '../src/moneyMarket.mjs';
import {sampleMoneyMarketMessage} from '../src/pages/moneyMarketSamples.mjs';
import {moneyMarketCopy,moneyMarketWorkbook} from '../src/moneyMarketExport.mjs';

test('clipboard table retains currency, bank columns, row order and empty cells',()=>{
 const rows=moneyMarketRows([sampleMoneyMarketMessage()]);
 const {text,html}=moneyMarketCopy(rows);
 const lines=text.split('\r\n').map(line=>line.split('\t'));
 assert.equal(lines.length,18);
 assert.deepEqual(lines[1],['Tenor','Bank 1','Bank 2','Bank 3','Bank 4']);
 assert.deepEqual(lines[2],['O/N','','1.22','','']);
 assert.deepEqual(lines[17],['1Y','','1.47','','']);
 assert.match(html,/<table>/);assert.match(html,/<td>1.22<\/td>/);
});
test('export round trips as a real Excel table with numeric rates and blanks',async()=>{
 const rows=moneyMarketRows([sampleMoneyMarketMessage()]);
 rows[0].banks[0]={rate:0};rows[1].banks[2]={rate:-.125678};
 const before=JSON.stringify(rows);
 const buffer=await moneyMarketWorkbook(rows);
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);
 const sheet=workbook.getWorksheet('SGD Money Market');
 assert.equal(sheet.getCell('A1').value,'SGD Money Market — Rates (%)');
 assert.equal(sheet.getTable('SGDMoneyMarket').table.tableRef,'A3:E19');
 assert.equal(sheet.getCell('B4').value,0);
 assert.equal(sheet.getCell('C4').value,1.22);
 assert.equal(sheet.getCell('D4').value,null);
 assert.equal(sheet.getCell('D5').value,-.125678);
 assert.equal(sheet.getCell('C19').value,1.47);
 assert.equal(sheet.getCell('C4').numFmt,'0.00####');
 assert.equal(JSON.stringify(rows),before);
});
