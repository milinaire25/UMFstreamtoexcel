export const MONEY_MARKET_HEADERS = ['Tenor', 'Bank 1', 'Bank 2', 'Bank 3', 'Bank 4'];
export const formatMoneyMarketRate = rate => rate.toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:6, useGrouping:false});
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function moneyMarketCopy(rows) {
  const values = rows.map(row => [row.tenor, ...row.banks.map(quote => quote ? formatMoneyMarketRate(quote.rate) : '')]);
  const text = [['Currency / Tenor', 'SGD (rates %)', '', '', ''], MONEY_MARKET_HEADERS, ...values].map(row => row.join('\t')).join('\r\n');
  const html = `<table><thead><tr><th>Currency / Tenor</th><th colspan="4">SGD (rates %)</th></tr><tr>${MONEY_MARKET_HEADERS.map(label=>`<th>${escapeHtml(label)}</th>`).join('')}</tr></thead><tbody>${values.map(row=>`<tr>${row.map(value=>`<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return {text, html};
}

export async function moneyMarketWorkbook(rows) {
  // Load only when exporting; other tabs don't download the Excel library.
  const {default: ExcelJS} = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'StreamtoApps';
  const sheet = workbook.addWorksheet('SGD Money Market');
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = 'SGD Money Market — Rates (%)';
  sheet.getCell('A1').font = {bold:true,size:16,color:{argb:'FF176B54'}};
  sheet.getRow(1).height = 28;
  sheet.addTable({name:'SGDMoneyMarket',ref:'A3',headerRow:true,totalsRow:false,
    style:{theme:'TableStyleMedium4',showRowStripes:true},
    columns:MONEY_MARKET_HEADERS.map(name=>({name,filterButton:true})),
    rows:rows.map(row=>[row.tenor,...row.banks.map(quote=>quote ? quote.rate : null)])});
  sheet.columns.forEach((column,index)=>{column.width=index===0?13:16;});
  for(let index=4;index<rows.length+4;index++) {
    sheet.getRow(index).height=20;
    for(let col=2;col<=5;col++) sheet.getCell(index,col).numFmt='0.00####';
  }
  sheet.views=[{state:'frozen',ySplit:3,xSplit:1}];
  return workbook.xlsx.writeBuffer();
}
