const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PERIOD = '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Q[1-4]|Sum|Win|Cal)';
const QUOTE = new RegExp(`^(?:(TTF|NBP)\\s+)?${PERIOD}(?:[- ]?(\\d{4}|\\d{2}))?\\s+([0-9]+(?:\\.[0-9]+)?)\\s*/\\s*([0-9]+(?:\\.[0-9]+)?)(?:\\s+(\\d+(?:\\.\\d+)?)\\s*mw)?$`, 'i');

export function gasPrices(bidText, askText) {
  const bid = Number(bidText);
  let ask = Number(askText);
  const decimals = bidText.split('.')[1]?.length || 0;
  // 32.35/50 means 32.35/32.50; 31.95/05 crosses to 32.05.
  if (decimals && !askText.includes('.') && askText.length === decimals) {
    const scale = 10 ** decimals;
    let units = Math.floor(bid) * scale + Number(askText);
    if (units < Math.round(bid * scale)) units += scale;
    ask = units / scale;
  }
  return { bid, ask };
}

function contractFor(period, yearText, timestamp, inferYears) {
  const monthIndex = MONTHS.findIndex(month => month.toLowerCase() === period.toLowerCase());
  const name = monthIndex >= 0 ? MONTHS[monthIndex] : period[0].toUpperCase() + period.slice(1).toLowerCase();
  const kind = monthIndex >= 0 ? 'month' : /^q/i.test(name) ? 'quarter' : /^cal/i.test(name) ? 'year' : 'season';
  const startMonth = monthIndex >= 0 ? monthIndex : kind === 'quarter' ? (Number(name[1]) - 1) * 3 : name === 'Sum' ? 3 : name === 'Win' ? 9 : 0;
  let year = yearText ? Number(yearText.length === 2 ? `20${yearText}` : yearText) : null;
  const inferred = !yearText && inferYears && timestamp !== null;
  if (inferred) {
    const date = new Date(timestamp);
    year = date.getUTCFullYear() + (startMonth < date.getUTCMonth() ? 1 : 0);
  }
  return { label: `${name}${year ? `-${String(year).slice(-2)}` : ' (year unspecified)'}`, kind,
    inferred, unresolved: year === null, order: year ? Date.UTC(year, startMonth, 1) : Infinity };
}

export function parseGasMessage(message, { defaultProduct = 'TTF', inferYears = true } = {}) {
  const data = message.eventData || message;
  if (typeof data.message !== 'string') return [];
  const created = Date.parse(data.createAt);
  const received = Date.parse(message._receivedAt);
  const timestamp = Number.isFinite(created) ? created : Number.isFinite(received) ? received : null;
  const sender = message.additionalData?.userId || data.userUuid;
  // Unknown senders cannot safely be consolidated into one broker.
  if (!sender) return [];
  const room = data.chatRoomId || message.additionalData?.chatRoomName || 'Unspecified room';
  const roomName = message.additionalData?.chatRoomName || room;
  const lines = data.message.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const sizes = {};
  for (const line of lines) {
    // Only parse standalone size lines; never mistake a price for a size.
    if (!/^\d+(?:\.\d+)?\s*mw\b/i.test(line)) continue;
    for (const segment of line.split(',')) {
      const size = segment.trim().match(/^(\d+(?:\.\d+)?)\s*(?:mw)?\s*(months?|seasons?|quarters?|years?)?$/i);
      if (size) sizes[size[2] ? size[2].toLowerCase().replace(/s$/, '') : 'all'] = Number(size[1]);
    }
  }
  let product = defaultProduct;
  let inferredProduct = true;
  const rows = [];
  for (const line of lines) {
    if (/^(TTF|NBP)$/i.test(line)) { product = line.toUpperCase(); inferredProduct = false; continue; }
    const unconfirmed = /[?？]\s*$/.test(line);
    const quoteLine = line.replace(/[?？]+\s*$/, '').trim();
    const match = quoteLine.match(QUOTE);
    if (!match) continue;
    const [, explicitProduct, period, year, bidText, askText, size] = match;
    if (explicitProduct) { product = explicitProduct.toUpperCase(); inferredProduct = false; }
    const contract = contractFor(period, year, timestamp, inferYears);
    const prices = gasPrices(bidText, askText);
    rows.push({ ...prices, product: product || 'Unspecified product', contract: contract.label,
      inferredProduct: inferredProduct && !!product, inferredYear: contract.inferred,
      unresolved: !product || contract.unresolved, order: contract.order,
      quantity: size ? Number(size) : sizes[contract.kind] ?? sizes.all ?? null,
      sender, room, roomName, timestamp, unconfirmed, source: data.message,
    });
  }
  return rows;
}

export function gasMarkets(messages, options) {
  const groups = new Map();
  messages.forEach((message, index) => {
    for (const quote of parseGasMessage(message, options)) {
      const key = JSON.stringify([quote.product, quote.contract]);
      if (!groups.has(key)) groups.set(key, { key, product: quote.product, contract: quote.contract,
        order: quote.order, unresolved: quote.unresolved, brokers: new Map() });
      const group = groups.get(key);
      const previous = group.brokers.get(quote.sender);
      if (!previous || (quote.timestamp ?? -Infinity) > (previous.timestamp ?? -Infinity)
          || (quote.timestamp === previous.timestamp && index >= previous.index)) {
        group.brokers.set(quote.sender, { ...quote, index });
      }
    }
  });
  return [...groups.values()].map(group => {
    const brokers = [...group.brokers.values()].sort((a, b) => a.sender.localeCompare(b.sender));
    return { ...group, brokers,
      bestBid: group.unresolved ? null : Math.max(...brokers.map(row => row.bid)),
      bestAsk: group.unresolved ? null : Math.min(...brokers.map(row => row.ask)),
    };
  }).sort((a, b) => a.product.localeCompare(b.product) || a.order - b.order || a.contract.localeCompare(b.contract));
}
