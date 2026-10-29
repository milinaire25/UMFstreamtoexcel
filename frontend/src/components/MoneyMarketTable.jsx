import React from 'react';
import { moneyMarketRows } from '../moneyMarket.mjs';

export default function MoneyMarketTable({messages}) {
  const rows = moneyMarketRows(messages);
  const hasRates = rows.some(row => row.banks.some(Boolean));
  return <div className="money-market">
    <h3 className="money-market-currency">Currency / Tenor <span>SGD</span></h3>
    <p className="gas-note">Rates (%) · Latest quote per bank and tenor · Last 3 minutes</p>
    <table className="bonds-table money-market-table" aria-label="SGD Money Market rates">
      <thead><tr>{['Tenor','Bank 1','Bank 2','Bank 3','Bank 4'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.tenor}>
        <td><strong>{row.tenor}</strong></td>
        {row.banks.map((quote,index) => <td key={index} className="bonds-price" title={quote ? `${quote.sender || 'Sender unavailable'}\n${quote.source}` : 'No recent quote'}>{quote ? quote.rate.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:6}) : ''}</td>)}
      </tr>)}</tbody>
    </table>
    {!hasRates && <p className="gas-note">Waiting for SGD rates. Messages must identify BANK: Provider1–Provider4 (or Bank1–Bank4) and TENOR SGD.</p>}
  </div>;
}
