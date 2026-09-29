import React from 'react';
import { powerOptionRows } from '../powerOptions.mjs';

const price = value => value === null ? '' : value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 4});

export default function PowerOptionsTable({ messages }) {
  const rows = powerOptionRows(messages);
  return <div>
    <p className="gas-note">Power options · Last 3 minutes · Newest first. Each quote stays separate. Colon-separated sizes refer to spread legs.</p>
    <table className="bonds-table power-options-table" aria-label="Power options quote history">
      <thead><tr>{['Contract', 'Strike Price', 'Structure', 'Bid', 'Ask', 'Size', 'Notes', 'Sender email'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.key} title={row.source}>
        <td><strong>{row.contract}</strong></td><td>{row.strikes}</td>
        <td><strong>{row.structure}</strong>{row.ratio && <small className="gas-assumption">{row.ratio}</small>}</td>
        <td className="bonds-price">{price(row.bid)}</td><td className="bonds-price">{price(row.ask)}</td>
        <td>{row.size || ''}{row.size?.includes(':') && <small className="gas-assumption">Leg sizes</small>}</td>
        <td className="power-option-notes">{row.notes}</td>
        <td className="bonds-sender">{row.sender}</td>
      </tr>)}
      {!rows.length && <tr><td colSpan={8} className="bonds-empty">Waiting for Power option quotes. CS, PS and Ratio CS messages appear here; flat contracts appear in Power.</td></tr>}
      </tbody>
    </table>
  </div>;
}
