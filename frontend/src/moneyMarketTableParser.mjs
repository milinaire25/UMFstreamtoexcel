// Preserve delimiters: empty cells must never shift a rate into another bank.
export function parseMoneyMarketTable(text, tenors) {
  const rawLines = text.split(/\r\n?|\n/).filter(line => line.trim());
  const delimiter = rawLines.some(line => line.includes('|')) ? '|' : rawLines.some(line => line.includes('\t')) ? '\t' : null;
  if (!delimiter) return null;
  const clean = value => value.replace(/[\u00a0\u2007\u202f]/g,' ').trim().replace(/^[?？]+(?=[a-z\d])/i,'').trim();
  const lines = rawLines.map(line => {
    let cells = line.split(delimiter);
    if (delimiter === '|') {
      if (!cells[0].trim()) cells.shift();
      if (!cells.at(-1).trim()) cells.pop();
    }
    return cells.map(clean);
  }).filter(cells => !cells.every(cell => /^:?-{3,}:?$/.test(cell)));
  const currencyRows = lines.filter(cells => /^Currency\s*\/\s*Tenor$/i.test(cells[0]));
  const headerRows = lines.filter(cells => /^Tenor$/i.test(cells[0]));
  if (!currencyRows.length && !headerRows.length) return null;
  if (currencyRows.length !== 1 || headerRows.length !== 1) return [];
  const currency = currencyRows[0];
  if (!/^SGD(?:\s*\(rates\s*%\))?$/i.test(currency[1] || '') || currency.slice(2).some(Boolean)) return [];
  const header = headerRows[0];
  const banks = header.slice(1).map(cell => Number(cell.match(/^Bank\s*([1-4])$/i)?.[1]));
  if (!banks.length || banks.some(bank => !bank) || new Set(banks).size !== banks.length) return [];
  const result = new Map();
  for (const cells of lines.slice(lines.indexOf(header) + 1)) {
    const tenor = cells[0].toUpperCase().replace(/^ON$/, 'O/N');
    if (!tenors.includes(tenor) || cells.length !== header.length) continue;
    const rates = cells.slice(1);
    // Reject a malformed row as a whole rather than guessing column alignment.
    if (rates.some(cell => cell && !/^-?\d+(?:\.\d+)?\s*%?$/.test(cell))) continue;
    for (let i=0;i<rates.length;i++) {
      if (!rates[i]) continue;
      const rate = Number(rates[i].replace(/\s*%$/, ''));
      if (!Number.isFinite(rate)) continue;
      const key = `${tenor}:${banks[i]}`;
      if (result.has(key) && result.get(key).rate !== rate) return [];
      result.set(key,{tenor,bank:banks[i],rate,currency:'SGD'});
    }
  }
  return [...result.values()];
}
