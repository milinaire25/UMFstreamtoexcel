import { normalizeMessageText } from '../../shared/messageText.mjs';

export function parsePowerOption(source) {
  const text = normalizeMessageText(source).trim();
  const head = text.match(/^(FY\s*\d{2}|CAL\s*\d{2}|Q\s*[1-4]\s*\d{2})\s+(VIC|NSW|QLD)\s*:?\s*(\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?)\s+(?:(\d+\s*x\s*\d+)\s+)?(RATIO\s+CS|CS|PS)\s*:?\s*(.*)$/i);
  if (!head) return null;
  const [, period, region, strikes, ratio, kind, rest] = head;
  // A ratio must be explicit, and must belong to a Ratio CS structure.
  if (Boolean(ratio) !== /^RATIO/i.test(kind)) return null;
  const body = rest.replace(/\s+(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\s*$/, '').replace(/^(?:\.{2,}|…)\s*/, '');
  const quote = body.match(/^(\d+(?:\.\d+)?)?\s*\/\s*(\d+(?:\.\d+)?)?(?=\s|$)/);
  if (!quote || (!quote[1] && !quote[2])) return null;
  const tail = body.slice(quote[0].length).trim();
  const suffix = tail.match(/^(?:(?:in\s+)?(block|blk|\d+(?:\.\d+)?(?:\s*:\s*\d+(?:\.\d+)?)?))?(?:\s+(.*))?$/i);
  if (!suffix) return null;
  const block = /^(block|blk)$/i.test(suffix[1] || '');
  const size = suffix[1] && !block ? suffix[1].replace(/\s/g, '') : null;
  const notes = suffix[2] || '';
  // Hedge details are retained separately; their numbers never become premiums or size.
  if (notes && !/^(?:x\s+\d+(?:\.\d+)?\s+at\s+\d+(?:\.\d+)?|\(naked\s+bid\s*\/\s*x\s+\d+(?:\.\d+)?\s+at\s+\d+(?:\.\d+)?\))$/i.test(notes)) return null;
  return {
    contract: `${period.replace(/\s/g, '').toUpperCase()} ${region.toUpperCase()}`, product: region.toUpperCase(),
    bid: quote[1] ? Number(quote[1]) : null, ask: quote[2] ? Number(quote[2]) : null,
    size, strikes: strikes.replace(/\s/g, ''),
    structure: /^RATIO/i.test(kind) ? 'Ratio CS' : kind.toUpperCase(),
    ratio: ratio ? ratio.replace(/\s/g, '') : null,
    notes: [block ? 'BLK' : '', notes].filter(Boolean).join(' · '), source,
  };
}

export function powerOptionRows(messages) {
  return messages.flatMap((message, index) => {
    const data = message.eventData || message;
    const received = Date.parse(message._receivedAt);
    const created = Date.parse(data.createAt);
    const timestamp = Number.isFinite(received) ? received : Number.isFinite(created) ? created : 0;
    return String(data.message || '').split(/\r\n?|\n/).flatMap((line, lineIndex) => {
      const quote = parsePowerOption(line);
      return quote ? [{ ...quote, timestamp, index, lineIndex, key: `${index}:${lineIndex}`,
        sender: message.additionalData?.userId || data.senderEmail || data.userId || 'Unknown sender' }] : [];
    });
  }).sort((a, b) => b.timestamp - a.timestamp || b.index - a.index || a.lineIndex - b.lineIndex);
}
