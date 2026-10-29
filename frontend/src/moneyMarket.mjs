import {parseMoneyMarketTable} from './moneyMarketTableParser.mjs';

export const MONEY_MARKET_TENORS = ['O/N', '1W', '2W', '3W', ...Array.from({length:11}, (_, i) => `${i+1}M`), '1Y'];

// Scoped to money-market messages so other market parsers stay unchanged.
function cleanLine(line) {
  return line.replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/(^|[\s:])[?？]+(?=[a-z\d])/gi, '$1 ').replace(/[ \t]+/g, ' ').trim();
}

export function parseMoneyMarket(message) {
  const data = message.eventData || message;
  if (typeof data.message !== 'string') return [];
  const created = Date.parse(data.createAt);
  const received = Date.parse(message._receivedAt);
  const timestamp = Number.isFinite(created) ? created : Number.isFinite(received) ? received : 0;
  const sender = message.additionalData?.userId || data.userUuid || '';
  const tableQuotes = parseMoneyMarketTable(data.message, MONEY_MARKET_TENORS);
  if (tableQuotes !== null) return tableQuotes.map(quote => ({...quote,timestamp,sender,source:data.message}));
  const lines = data.message.split(/\r\n?|\n/).map(cleanLine).filter(Boolean);
  const starts = lines.flatMap((line,index) => /^BANK\s*:/i.test(line) ? [index] : []);
  // Each bank section must declare its own currency. Never carry bank/currency
  // state from an earlier section into a later section.
  if (starts.length > 1 && starts[0] !== 0) return [];
  const sections = starts.length > 1
    ? starts.map((start,index) => lines.slice(start,starts[index+1] ?? lines.length))
    : [lines];
  const combined = new Map();
  for (const section of sections) {
    const quotes = parseBankSection(section);
    if (!quotes.length) return [];
    for (const quote of quotes) {
      const key = `${quote.bank}:${quote.tenor}`;
      if (combined.has(key) && combined.get(key).rate !== quote.rate) return [];
      combined.set(key, quote);
    }
  }
  return [...combined.values()].map(quote => ({...quote,timestamp,sender,source:data.message}));
}

function parseBankSection(lines) {
  const banks = lines.filter(line => /^BANK\s*:/i.test(line));
  const currencies = lines.filter(line => /^(?:TENOR|CURRENCY)\b/i.test(line));
  // Require an explicit, unambiguous bank and currency; never infer them from sender order.
  if (banks.length !== 1 || currencies.length !== 1) return [];
  const bank = banks[0].match(/^BANK\s*:\s*(?:Provider|Bank)\s*([1-4])$/i);
  const currency = currencies[0].match(/^(?:TENOR|CURRENCY)\s*:?\s*SGD$/i);
  if (!bank || !currency) return [];
  const rates = new Map();
  for (const line of lines) {
    const match = line.match(/^(O\/?N|(?:[1-9]|1[01])\s*(?:-\s*)?(?:Weeks?|W|Months?|M|Years?|Y))\s+(-?\d+(?:\.\d+)?)\s*%?$/i);
    if (!match) continue;
    let tenor;
    if (/^O/i.test(match[1])) tenor = 'O/N';
    else {
      const parts = match[1].match(/^(\d+)\s*-?\s*([WMY])/i);
      tenor = `${Number(parts[1])}${parts[2].toUpperCase()}`;
    }
    if (!MONEY_MARKET_TENORS.includes(tenor)) continue;
    const rate = Number(match[2]);
    if (!Number.isFinite(rate)) continue;
    // Conflicting duplicate tenors in one message are ambiguous, not an update.
    if (rates.has(tenor) && rates.get(tenor) !== rate) return [];
    rates.set(tenor, rate);
  }
  return [...rates].map(([tenor, rate]) => ({bank:Number(bank[1]), currency:'SGD', tenor, rate}));
}

export function moneyMarketRows(messages) {
  const cells = new Map();
  messages.forEach((message, index) => {
    for (const quote of parseMoneyMarket(message)) {
      const key = `${quote.tenor}:${quote.bank}`;
      const previous = cells.get(key);
      if (!previous || quote.timestamp > previous.timestamp || (quote.timestamp === previous.timestamp && index > previous.index)) cells.set(key, {...quote, index});
    }
  });
  return MONEY_MARKET_TENORS.map(tenor => ({tenor, banks:[1,2,3,4].map(bank => cells.get(`${tenor}:${bank}`) || null)}));
}
