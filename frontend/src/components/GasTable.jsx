import React, { useState } from 'react';
import { gasMarkets } from '../gas.mjs';

const price = value => value === null ? '—' : value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export default function GasTable({ messages }) {
  const [defaultProduct, setDefaultProduct] = useState('TTF');
  const [inferYears, setInferYears] = useState(true);
  const markets = gasMarkets(messages, { defaultProduct, inferYears });
  return <div className="gas-view">
    <div className="gas-settings">
      <label>Product when omitted <select value={defaultProduct} onChange={event => setDefaultProduct(event.target.value)}>
        <option value="TTF">TTF</option><option value="NBP">NBP</option><option value="">Unspecified</option>
      </select></label>
      <label><input type="checkbox" checked={inferYears} onChange={event => setInferYears(event.target.checked)} /> Resolve missing years to next delivery period</label>
    </div>
    <p className="gas-note">Quotes received in the last 3 minutes. Latest quote per sender and period across the selected session’s chat rooms. Best bid is the highest; best ask is the lowest. Messages ending in ? are labeled Unconfirmed.</p>
    {!markets.length && <div className="gas-empty">Waiting for gas quotes.<br /><code>TTF<br />Nov 32.35/50<br />20mw</code></div>}
    {markets.map(market => <section className="gas-market" key={market.key}>
      <div className="gas-heading"><h3>{market.product} {market.contract}</h3><span>{market.brokers.length} broker{market.brokers.length === 1 ? '' : 's'}</span></div>
      <div className="gas-table-scroll"><table className="gas-table" aria-label={`${market.product} ${market.contract} broker quotes`}>
        <thead><tr>{['Broker / Sender', 'Bid', 'Ask', 'Size (MW)', 'Message time'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{market.brokers.map(broker => <tr key={broker.sender} title={broker.source}>
          <th scope="row">{broker.sender}<small className="gas-assumption">{broker.roomName}</small>{broker.unconfirmed && <small className="gas-unconfirmed">Unconfirmed (?)</small>}{(broker.inferredYear || broker.inferredProduct) && <small className="gas-assumption">{[broker.inferredProduct && 'Product default', broker.inferredYear && 'Year inferred'].filter(Boolean).join(' · ')}</small>}</th>
          <td className={broker.bid === market.bestBid ? 'gas-best' : ''}>{price(broker.bid)}</td>
          <td className={broker.ask === market.bestAsk ? 'gas-best' : ''}>{price(broker.ask)}</td>
          <td>{broker.quantity ?? '—'}</td>
          <td>{broker.timestamp === null ? '—' : new Date(broker.timestamp).toLocaleString('en-SG', { hour12: false })}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">Best Market</th><td>{price(market.bestBid)}</td><td>{price(market.bestAsk)}</td><td colSpan={2}>{market.unresolved ? 'Resolve product/year to compare' : market.bestBid > market.bestAsk ? 'Crossed quotes' : market.brokers.some(broker => broker.unconfirmed && (broker.bid === market.bestBid || broker.ask === market.bestAsk)) ? 'Includes unconfirmed quotes' : 'Across displayed brokers'}</td></tr></tfoot>
      </table></div>
    </section>)}
  </div>;
}
