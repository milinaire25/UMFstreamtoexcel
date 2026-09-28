import React from 'react';
import { powerRows } from '../power.mjs';

const price = value => value === null ? '—' : value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export default function PowerTable({ messages }) {
  const rows = powerRows(messages);
  return <div>
    <p className="gas-note">Flat Power quotes · Last 3 minutes · Newest first. Each message stays separate.</p>
    <table className="bonds-table power-table" aria-label="Power quote history">
      <thead><tr>{['Contract', 'Bid', 'Ask', 'Size', 'Time', 'Sender email'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.key} title={row.source}>
        <td className="power-contract"><strong>{row.contract}</strong></td>
        <td className="bonds-price">{price(row.bid)}</td><td className="bonds-price">{price(row.ask)}</td>
        <td>{row.size || (row.block ? 'Block' : '—')}{row.size && row.block && <small className="gas-assumption">Block</small>}</td>
        <td title={row.time ? 'Time supplied in message text' : 'UMF message receipt time'}>{row.time || (row.timestamp ? new Date(row.timestamp).toLocaleTimeString('en-GB', { hour12: false }) : '—')}</td>
        <td className="bonds-sender">{row.sender}</td>
      </tr>)}
      {!rows.length && <tr><td colSpan={6} className="bonds-empty">Waiting for Power quotes. New VIC, NSW and QLD quotes will appear automatically.</td></tr>}
      </tbody>
    </table>
  </div>;
}
