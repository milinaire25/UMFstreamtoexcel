// Supported quote: 7.63% NCD Google bond MD 20/08/2028 8.60 offer.
// Require explicit fields rather than treating ordinary chat as a bond quote.
export function parseBondQuote(text) {
  if (typeof text !== 'string') return null;
  const match = text.trim().match(/^(\d+(?:\.\d+)?)\s*%\s+(NCD|CD|CP|BOND|DEBENTURE)\s+(.+?)\s+(?:MD|maturity(?:\s+date)?)\s*:?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(.+?))?\s*$/i);
  if (!match) return null;
  const [, coupon, instrument, rawIssuer, day, month, year, tail = ''] = match;
  const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`);
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) return null;
  const issuer = rawIssuer.replace(/\s+bonds?$/i, '').trim();
  if (!issuer) return null;
  const price = tail.match(/^(\d+(?:\.\d+)?%?)\s+(?:offer|offered|price)\.?$/i)
    || tail.match(/^(?:offer|offered|price)\s*:?\s*(\d+(?:\.\d+)?%?)\.?$/i);
  // Unknown trailing terms may be a bid, quantity, or another quote.
  if (tail && !price) return null;
  return {
    issuer, coupon: `${coupon}%`, instrument: instrument.toUpperCase(),
    maturity: `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`,
    offerPrice: price?.[1] || '',
  };
}

export function latestBonds(messages) {
  const seen = new Set();
  return messages.flatMap((message, index) => {
    const data = message.eventData || message;
    const quote = parseBondQuote(data.message);
    if (!quote) return [];
    const key = JSON.stringify(message);
    // The dashboard can receive the same saved payload on reconnect.
    if (seen.has(key)) return [];
    seen.add(key);
    const created = Date.parse(data.createAt);
    const received = Date.parse(message._receivedAt);
    const timestamp = Number.isFinite(created) ? created : Number.isFinite(received) ? received : null;
    return [{ ...quote, key, index, timestamp,
      sender: message.additionalData?.userId || data.userUuid || '—',
      text: data.message,
    }];
  }).sort((a, b) => (b.timestamp ?? -Infinity) - (a.timestamp ?? -Infinity) || b.index - a.index).slice(0, 10);
}
