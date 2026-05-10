export interface PTAPosting {
  account: string;
  amount: number | null;
  currency: string;
}

export interface PTATransaction {
  date: string;
  cleared: boolean;
  payee: string;
  postings: PTAPosting[];
  isBalanced: boolean;
  imbalance: number;
}

export interface AccountBalance {
  account: string;
  balance: number;
  currency: string;
}

export interface PTAParseResult {
  transactions: PTATransaction[];
  balances: AccountBalance[];
  errors: string[];
  rawText: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TX_HEADER_RE = /^(\d{4}-\d{2}-\d{2})\s*([*!])?\s*(?:txn\s+)?(.*)$/;
const POSTING_RE = /^(\s+)(\S[^;]*?)(?:\s{2,}|\t)([+-]?\$?[\d,]+(?:,\d{3})*\.?\d*)\s*([A-Z]{2,4})?\s*(?:;.*)?$/;
const POSTING_ACCOUNT_ONLY_RE = /^(\s+)(\S[^;]*?)\s*(?:;.*)?$/;
const AMOUNT_INLINE_RE = /[+-]?\$?[\d,]+(?:,\d{3})*\.?\d*/;

function parseAmount(raw: string): number {
  const clean = raw.replace(/\$/, '').replace(/,/g, '');
  return parseFloat(clean);
}

function inferCurrency(raw: string): string {
  if (raw.startsWith('$') || raw.startsWith('-$') || raw.startsWith('+$')) return 'USD';
  return '';
}

function finalizeTransaction(
  date: string,
  cleared: boolean,
  payee: string,
  rawPostings: Array<{ account: string; amount: number | null; currency: string }>,
  errors: string[]
): PTATransaction {
  const nullCount = rawPostings.filter(p => p.amount === null).length;
  let postings = [...rawPostings];

  if (nullCount === 1) {
    const knownSum = postings
      .filter(p => p.amount !== null)
      .reduce((sum, p) => sum + (p.amount as number), 0);
    const autoAmount = -knownSum;
    const nullIdx = postings.findIndex(p => p.amount === null);
    const inferredCurrency = postings.find(p => p.currency)?.currency ?? 'USD';
    postings[nullIdx] = { ...postings[nullIdx], amount: autoAmount, currency: inferredCurrency };
  } else if (nullCount > 1) {
    errors.push(`Transaction on ${date} "${payee}": multiple postings have no amount — cannot auto-balance.`);
    postings = postings.map(p =>
      p.amount === null ? { ...p, amount: 0 } : p
    );
  }

  const total = postings.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const imbalance = Math.round(total * 1e9) / 1e9;
  const isBalanced = Math.abs(imbalance) < 1e-6;

  if (!isBalanced) {
    errors.push(`Transaction on ${date} "${payee}": unbalanced by ${imbalance > 0 ? '+' : ''}${imbalance.toFixed(2)}.`);
  }

  return { date, cleared, payee, postings, isBalanced, imbalance };
}

export function parsePTA(text: string): PTAParseResult {
  const lines = text.split('\n');
  const transactions: PTATransaction[] = [];
  const errors: string[] = [];

  let currentDate = '';
  let currentCleared = false;
  let currentPayee = '';
  let currentPostings: Array<{ account: string; amount: number | null; currency: string }> = [];
  let inTransaction = false;

  const commitTransaction = () => {
    if (!inTransaction) return;
    transactions.push(
      finalizeTransaction(currentDate, currentCleared, currentPayee, currentPostings, errors)
    );
    inTransaction = false;
    currentPostings = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    if (!line.trim()) {
      commitTransaction();
      continue;
    }

    if (line.trim().startsWith(';')) {
      continue;
    }

    const headerMatch = TX_HEADER_RE.exec(line);
    if (headerMatch && DATE_RE.test(headerMatch[1])) {
      commitTransaction();
      currentDate = headerMatch[1];
      currentCleared = headerMatch[2] === '*' || headerMatch[2] === '!';
      currentPayee = headerMatch[3]
        .replace(/^"([^"]*)".*$/, '$1')
        .replace(/^([^"]*)"[^"]*"\s*$/, '$1')
        .trim();
      inTransaction = true;
      continue;
    }

    if (inTransaction && /^\s/.test(line)) {
      const postingMatch = POSTING_RE.exec(line);
      if (postingMatch) {
        const account = postingMatch[2].trim();
        const rawAmount = postingMatch[3];
        const explicitCurrency = postingMatch[4] ?? '';
        const currency = explicitCurrency || inferCurrency(rawAmount) || 'USD';
        const amount = parseAmount(rawAmount);
        currentPostings.push({ account, amount, currency });
        continue;
      }

      const accountOnlyMatch = POSTING_ACCOUNT_ONLY_RE.exec(line);
      if (accountOnlyMatch) {
        const account = accountOnlyMatch[2].trim();
        if (account && !AMOUNT_INLINE_RE.test(account.slice(-10))) {
          currentPostings.push({ account, amount: null, currency: '' });
          continue;
        }
      }
    }
  }

  commitTransaction();

  const balanceMap = new Map<string, { balance: number; currency: string }>();
  for (const tx of transactions) {
    for (const posting of tx.postings) {
      if (posting.amount === null) continue;
      const key = posting.account;
      const existing = balanceMap.get(key) ?? { balance: 0, currency: posting.currency || 'USD' };
      balanceMap.set(key, {
        balance: Math.round((existing.balance + posting.amount) * 1e9) / 1e9,
        currency: existing.currency || posting.currency || 'USD',
      });
    }
  }

  const balances: AccountBalance[] = Array.from(balanceMap.entries())
    .map(([account, { balance, currency }]) => ({ account, balance, currency }))
    .sort((a, b) => a.account.localeCompare(b.account));

  return { transactions, balances, errors, rawText: text };
}

export function exportToJournal(result: PTAParseResult): string {
  const lines: string[] = [];
  for (const tx of result.transactions) {
    const cleared = tx.cleared ? '* ' : '';
    lines.push(`${tx.date} ${cleared}${tx.payee}`);
    for (const posting of tx.postings) {
      const amtStr =
        posting.amount !== null
          ? `  ${posting.currency === 'USD' ? '$' : ''}${posting.amount.toFixed(2)}${posting.currency && posting.currency !== 'USD' ? ' ' + posting.currency : ''}`
          : '';
      lines.push(`    ${posting.account}${amtStr ? '  ' + amtStr.trim() : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
