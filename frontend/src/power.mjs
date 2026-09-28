// Power quotes are message history, never a merged best-market book.
export function parsePowerLine(source) {
  if (/\b30\s*p\b/i.test(source)) return null;
  const head = source.trim().match(/^(FY\s*\d{2}|CAL\s*\d{2}|Q\s*[1-4]\s*\d{2})\s+(VIC|NSW|QLD)\s*:?\s*(.*)$/i);
  if (!head) return null;
  const contract = `${head[1].replace(/\s/g, '').toUpperCase()} ${head[2].toUpperCase()}`;
  let body = head[3];
  const timeMatch = body.match(/\s+((?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)\s*$/);
  if (timeMatch) body = body.slice(0, timeMatch.index).trim();
  // Broker shorthand: a spaced trailing integer after a bid-only slash is size.
  body = body.replace(/^(\d+(?:\.\d+)?)\/\s+(\d+)$/, '$1/ in $2');
  const quote = body.match(/^(\d+(?:\.\d+)?)?\s*\/\s*(\d+(?:\.\d+)?)?(?=\s|$)/);
  if (!quote || (!quote[1] && !quote[2])) return null;
  const bid = quote[1] ? Number(quote[1]) : null;
  const ask = quote[2] ? Number(quote[2]) : null;
  const tail = body.slice(quote[0].length).trim();
  // Only flat quote suffixes are allowed: never read option strikes as prices.
  const suffix = tail.match(/^(?:(?:in\s+)?(\d+(?:\.\d+)?)\s*)?(?:(?:in\s+)?(blk|block))?$/i);
  if (!suffix) return null;
  const size = suffix[1] || null;
  const block = Boolean(suffix[2]);
  return { contract, bid, ask, size, block, time: timeMatch?.[1] || null, source };
}

export function powerRows(messages) {
  return messages.flatMap((message, messageIndex) => {
    const event = message.eventData || message;
    const received = Date.parse(message._receivedAt);
    const created = Date.parse(event.createAt);
    const timestamp = Number.isFinite(received) ? received : Number.isFinite(created) ? created : 0;
    const sender = message.additionalData?.userId || event.senderEmail || event.userId || 'Unknown sender';
    return String(event.message || '').split(/\r?\n/).flatMap((line, lineIndex) => {
      const quote = parsePowerLine(line);
      return quote ? [{ ...quote, sender, timestamp, messageIndex, lineIndex, key: `${messageIndex}:${lineIndex}` }] : [];
    });
  }).sort((a, b) => b.timestamp - a.timestamp || b.messageIndex - a.messageIndex || a.lineIndex - b.lineIndex);
}
