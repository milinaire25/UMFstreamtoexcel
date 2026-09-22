import React, { useEffect, useMemo, useState } from 'react';
import { gasBulletinRows, quoteAge } from '../gasBulletin.mjs';

const price = value => value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export default function GasBulletin({ messages }) {
  const [now, setNow] = useState(Date.now);
  const rows = useMemo(() => gasBulletinRows(messages), [messages]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <div className="gas-bulletin">
    <p className="gas-note">Latest TTF quote per sender and contract, ordered by delivery period. Time is message age; ⚠ marks quotes at least 4 minutes old. Missing product defaults to TTF; missing years use the next delivery period.</p>
    <table className="gas-table gas-bulletin-table" aria-label="TTF gas bulletin board">
      <thead><tr>{['TTF', 'BID', 'ASK', 'Size', 'Time', 'Sender email'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => {
        const age = quoteAge(row.timestamp, now);
        return <tr key={row.key} className={age.stale ? 'gas-stale' : ''} title={row.source}>
          <th scope="row">{row.contract}
            {(row.inferredProduct || row.inferredYear) && <small className="gas-assumption">{[row.inferredProduct && 'TTF default', row.inferredYear && 'Year inferred'].filter(Boolean).join(' · ')}</small>}
            {row.unconfirmed && <small className="gas-unconfirmed">Unconfirmed (?)</small>}
          </th>
          <td>{price(row.bid)}</td><td>{price(row.ask)}</td>
          <td>{row.quantity === null ? '—' : `${row.quantity}MW`}</td>
          <td title={row.timestamp === null ? 'Message time unavailable' : new Date(row.timestamp).toLocaleString()}>
            {age.label}{age.stale && <span className="gas-age-warning" role="img" aria-label="Quote at least four minutes old"> ⚠</span>}
          </td>
          <td className="gas-bulletin-sender">{row.sender}</td>
        </tr>;
      })}
      {!rows.length && <tr><td colSpan={6} className="gas-empty">Waiting for TTF quotes. New matching messages will appear automatically.</td></tr>}
      </tbody>
    </table>
  </div>;
}
