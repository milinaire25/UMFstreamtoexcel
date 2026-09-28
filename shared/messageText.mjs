// Normalize quote separators for display/parsing without changing the raw event.
// Question marks are ambiguous: preserve trailing questions and numeric damage.
export function normalizeMessageText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n?/g, '\n').split('\n').map(rawLine => {
    const line = rawLine.replace(/[\u00a0\u2007\u202f]/g, ' ');
    // Leave ordinary conversation unchanged. Only recognized market lines qualify.
    if (!/^\s*(?:TTF\b|NBP\b|FY\s*\d|CAL\s*\d|Q\s*[1-4]|Jan\b|Feb\b|Mar\b|Apr\b|May\b|Jun\b|Jul\b|Aug\b|Sep\b|Oct\b|Nov\b|Dec\b|Sum\d|Win\d|\d+(?:\.\d+)?\s*(?:%|mw\b))/i.test(line)) return rawLine;
    return line.replace(/[?？]+/g, (markers, offset) => {
      const before = line.slice(0, offset);
      const after = line.slice(offset + markers.length);
      if (!/^[a-z\d]/i.test(after)) return markers; // includes terminal questions
      if (!/[\s/]$/.test(before)) return markers; // inside a token/number
      if (/^\d/.test(after) && /[/.]\s*$/.test(before)) return markers;
      return ' ';
    }).replace(/[ \t]+/g, ' ');
  }).join('\n');
}
