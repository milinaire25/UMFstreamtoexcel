import { gasMarkets } from './gas.mjs';

export const STALE_QUOTE_MS = 4 * 60 * 1000;

export function quoteAge(timestamp, now) {
  if (timestamp === null || !Number.isFinite(timestamp)) return { label: '—', stale: false };
  const age = Math.max(0, now - timestamp);
  const seconds = Math.floor(age / 1000);
  const label = seconds < 60 ? `${seconds} sec`
    : seconds < 3600 ? `${Math.floor(seconds / 60)} min`
    : seconds < 86400 ? `${Math.floor(seconds / 3600)} hr`
    : `${Math.floor(seconds / 86400)} day`;
  return { label, stale: age >= STALE_QUOTE_MS };
}

export function gasBulletinRows(messages) {
  return gasMarkets(messages, { defaultProduct: 'TTF', inferYears: true })
    .filter(market => market.product === 'TTF')
    .flatMap(market => market.brokers.map(broker => ({
      ...broker,
      key: JSON.stringify([market.key, broker.sender]),
      contract: broker.contract.replace(/^Sum(?=-| )/, 'Summer').replace(/^Win(?=-| )/, 'Winter'),
    })));
}
