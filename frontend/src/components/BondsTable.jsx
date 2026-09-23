import React from 'react';
import { latestBonds } from '../bonds.mjs';

export default function BondsTable({ messages }) {
  const bonds = latestBonds(messages);
  return (
    <div className="bonds-view">
      <p className="bonds-summary">Latest {bonds.length} bond messages · Last 3 minutes · Newest first</p>
      <table className="bonds-table" aria-label="Latest bond messages">
        <thead><tr>
          {['Time', 'Sender', 'Issuer', 'Coupon', 'Instrument', 'Maturity', 'Offer / Price'].map(label => (
            <th key={label} scope="col">{label}</th>
          ))}
        </tr></thead>
        <tbody>
          {bonds.map(bond => (
            <tr key={bond.key} title={bond.text}>
              <td title={bond.timestamp === null ? undefined : new Date(bond.timestamp).toLocaleString()}>
                {bond.timestamp === null ? '—' : new Date(bond.timestamp).toLocaleTimeString('en-SG', { hour12: false })}
              </td>
              <td className="bonds-sender">{bond.sender}</td>
              <td className="bonds-issuer">{bond.issuer}</td>
              <td>{bond.coupon}</td>
              <td>{bond.instrument}</td>
              <td>{bond.maturity}</td>
              <td className="bonds-price">{bond.offerPrice || '—'}</td>
            </tr>
          ))}
          {!bonds.length && <tr><td colSpan={7} className="bonds-empty">
            No matching bond messages yet.<br />
            Example: 7.63% NCD Google bond MD 20/08/2028 8.60 offer
          </td></tr>}
        </tbody>
      </table>
    </div>
  );
}
