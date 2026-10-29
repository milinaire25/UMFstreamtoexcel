import React, {useState} from 'react';
import {moneyMarketCopy, moneyMarketWorkbook, formatMoneyMarketRate} from '../moneyMarketExport.mjs';
import { moneyMarketRows } from '../moneyMarket.mjs';

export default function MoneyMarketTable({messages}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const rows = moneyMarketRows(messages);
  const hasRates = rows.some(row => row.banks.some(Boolean));
  async function exportExcel() {
    setBusy(true); setStatus('Preparing Excel file…');
    try {
      const buffer = await moneyMarketWorkbook(rows);
      const url = URL.createObjectURL(new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link = document.createElement('a');
      link.href = url; link.download = `Money-Market-SGD-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Excel download started.');
    } catch { setStatus('Export failed. Please try again.'); }
    finally { setBusy(false); }
  }
  async function copyTable() {
    const {text, html} = moneyMarketCopy(rows);
    setManualCopy('');
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([text],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})})]);
        } catch { await navigator.clipboard.writeText(text); }
      } else { await navigator.clipboard.writeText(text); }
      setStatus('Table copied. Paste into Excel or your messaging app.');
    } catch {
      setManualCopy(text); setStatus('Clipboard access was blocked. Select and copy the text below.');
    }
  }
  return <div className="money-market">
    <div className="money-market-actions">
      <button className="sm" disabled={!hasRates || busy} onClick={exportExcel}>{busy ? 'Exporting…' : 'Export to Excel'}</button>
      <button className="sm" disabled={!hasRates} onClick={copyTable}>Copy table</button>
      <span role="status">{status}</span>
    </div>
    {manualCopy && <textarea className="money-market-copy" aria-label="Money Market table to copy" readOnly value={manualCopy} onFocus={event=>event.target.select()} />}
    <h3 className="money-market-currency">Currency / Tenor <span>SGD</span></h3>
    <p className="gas-note">Rates (%) · Latest quote per bank and tenor · Last 3 minutes</p>
    <table className="bonds-table money-market-table" aria-label="SGD Money Market rates">
      <thead><tr>{['Tenor','Bank 1','Bank 2','Bank 3','Bank 4'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.tenor}>
        <td><strong>{row.tenor}</strong></td>
        {row.banks.map((quote,index) => <td key={index} className="bonds-price" title={quote ? `${quote.sender || 'Sender unavailable'}\n${quote.source}` : 'No recent quote'}>{quote ? formatMoneyMarketRate(quote.rate) : ''}</td>)}
      </tr>)}</tbody>
    </table>
    {!hasRates && <p className="gas-note">Waiting for SGD rates. Messages must identify BANK: Provider1–Provider4 (or Bank1–Bank4) and TENOR SGD.</p>}
  </div>;
}
