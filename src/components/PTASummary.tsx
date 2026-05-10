import React, { useState } from 'react';
import { PTAParseResult, exportToJournal } from '../utils/ptaParser';
import { cn } from '../utils/ui';

interface PTASummaryProps {
  result: PTAParseResult;
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null) return '—';
  const abs = Math.abs(amount).toFixed(2);
  const sign = amount < 0 ? '-' : '+';
  if (currency === 'USD') return `${sign}$${abs}`;
  if (currency) return `${sign}${abs} ${currency}`;
  return `${sign}${abs}`;
}

function amountColor(amount: number | null): string {
  if (amount === null) return 'text-text-meta';
  if (amount < 0) return 'text-danger';
  return 'text-primary';
}

export const PTASummary: React.FC<PTASummaryProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'balances'>('transactions');

  const handleExport = () => {
    const content = exportToJournal(result);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.journal';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 border-4 border-border-light bg-surface shadow-pixel-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-border-light bg-background-dark px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest font-display">
            ⬛ LEDGER BLOCK
          </span>
          <span className="text-[9px] text-text-meta">
            {result.transactions.length} tx
          </span>
        </div>
        <button
          onClick={handleExport}
          title="Export as .journal file"
          className="border-2 border-border-light bg-surface px-2 py-1 text-[8px] font-bold text-text-meta uppercase hover:bg-primary/10 hover:text-primary shadow-pixel-btn transition-colors"
        >
          ↓ .JOURNAL
        </button>
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="border-b-2 border-danger/50 bg-danger/10 px-3 py-2 space-y-1">
          {result.errors.map((err, i) => (
            <p key={i} className="text-[9px] text-danger">
              ⚠ {err}
            </p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b-2 border-border-light">
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            'flex-1 py-1 text-[9px] font-bold uppercase transition-colors',
            activeTab === 'transactions'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-text-meta hover:text-text-light'
          )}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={cn(
            'flex-1 py-1 text-[9px] font-bold uppercase transition-colors',
            activeTab === 'balances'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-text-meta hover:text-text-light'
          )}
        >
          Balances
        </button>
      </div>

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="overflow-x-auto">
          {result.transactions.length === 0 ? (
            <p className="px-3 py-4 text-center text-[9px] text-text-meta">No transactions found.</p>
          ) : (
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="bg-background-dark">
                  <th className="px-2 py-1 text-left text-text-meta font-bold uppercase border-b border-border-light">Date</th>
                  <th className="px-2 py-1 text-left text-text-meta font-bold uppercase border-b border-border-light">Payee</th>
                  <th className="px-2 py-1 text-left text-text-meta font-bold uppercase border-b border-border-light">Account</th>
                  <th className="px-2 py-1 text-right text-text-meta font-bold uppercase border-b border-border-light">Amount</th>
                  <th className="px-2 py-1 text-center text-text-meta font-bold uppercase border-b border-border-light">✓</th>
                </tr>
              </thead>
              <tbody>
                {result.transactions.map((tx, txIdx) => (
                  tx.postings.map((posting, postIdx) => (
                    <tr
                      key={`${txIdx}-${postIdx}`}
                      className={cn(
                        'border-b border-border-light/30',
                        !tx.isBalanced ? 'bg-danger/5' : txIdx % 2 === 0 ? 'bg-transparent' : 'bg-background-dark/40'
                      )}
                    >
                      {postIdx === 0 ? (
                        <>
                          <td className="px-2 py-1 text-text-meta whitespace-nowrap" rowSpan={tx.postings.length}>
                            {tx.date}
                          </td>
                          <td className="px-2 py-1 text-text-light whitespace-nowrap max-w-[100px] truncate" rowSpan={tx.postings.length}>
                            {tx.cleared && <span className="text-primary mr-1">✓</span>}
                            {tx.payee}
                          </td>
                        </>
                      ) : null}
                      <td className="px-2 py-1 text-text-meta font-mono whitespace-nowrap">
                        {posting.account}
                      </td>
                      <td className={cn('px-2 py-1 text-right font-mono whitespace-nowrap tabular-nums', amountColor(posting.amount))}>
                        {formatAmount(posting.amount, posting.currency)}
                      </td>
                      {postIdx === 0 ? (
                        <td className="px-2 py-1 text-center" rowSpan={tx.postings.length}>
                          {tx.isBalanced
                            ? <span className="text-primary">✓</span>
                            : <span className="text-danger" title={`Imbalance: ${tx.imbalance}`}>✗</span>
                          }
                        </td>
                      ) : null}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Balances tab */}
      {activeTab === 'balances' && (
        <div className="overflow-x-auto">
          {result.balances.length === 0 ? (
            <p className="px-3 py-4 text-center text-[9px] text-text-meta">No balances computed.</p>
          ) : (
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="bg-background-dark">
                  <th className="px-2 py-1 text-left text-text-meta font-bold uppercase border-b border-border-light">Account</th>
                  <th className="px-2 py-1 text-right text-text-meta font-bold uppercase border-b border-border-light">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.balances.map((bal, i) => {
                  const topLevel = bal.account.split(':')[0];
                  return (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border-light/30',
                        i % 2 === 0 ? 'bg-transparent' : 'bg-background-dark/40'
                      )}
                    >
                      <td className="px-2 py-1 font-mono">
                        <span className="text-text-meta">{topLevel}:</span>
                        <span className="text-text-light">{bal.account.slice(topLevel.length + 1) || bal.account}</span>
                      </td>
                      <td className={cn('px-2 py-1 text-right font-mono tabular-nums', amountColor(bal.balance))}>
                        {formatAmount(bal.balance, bal.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-border-light bg-background-dark px-3 py-1 flex justify-between items-center">
        <span className="text-[8px] text-text-meta">
          {result.balances.length} accounts
        </span>
        <span className={cn(
          'text-[8px] font-bold uppercase',
          result.errors.length > 0 ? 'text-danger' : 'text-primary'
        )}>
          {result.errors.length > 0 ? `${result.errors.length} ERROR(S)` : 'BALANCED'}
        </span>
      </div>
    </div>
  );
};
