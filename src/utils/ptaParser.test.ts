import { describe, it, expect } from 'vitest';
import { parsePTA, exportToJournal } from './ptaParser';

describe('parsePTA', () => {
  it('parses a single balanced transaction with explicit amounts', () => {
    const text = `
2024-01-15 * Groceries
    Expenses:Food    $50.00
    Assets:Checking  -$50.00
`.trim();
    const result = parsePTA(text);
    expect(result.transactions).toHaveLength(1);
    const tx = result.transactions[0];
    expect(tx.date).toBe('2024-01-15');
    expect(tx.cleared).toBe(true);
    expect(tx.payee).toBe('Groceries');
    expect(tx.postings).toHaveLength(2);
    expect(tx.postings[0].amount).toBeCloseTo(50.0);
    expect(tx.postings[1].amount).toBeCloseTo(-50.0);
    expect(tx.isBalanced).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('auto-balances a posting with no amount', () => {
    const text = `
2024-01-20 Salary
    Assets:Checking    $3000.00
    Income:Salary
`.trim();
    const result = parsePTA(text);
    expect(result.transactions).toHaveLength(1);
    const tx = result.transactions[0];
    expect(tx.isBalanced).toBe(true);
    const incomePotsting = tx.postings.find(p => p.account === 'Income:Salary');
    expect(incomePotsting?.amount).toBeCloseTo(-3000.0);
    expect(result.errors).toHaveLength(0);
  });

  it('calculates correct account balances across multiple transactions', () => {
    const text = `
2024-01-01 * Opening Balance
    Assets:Checking    $5000.00
    Equity:Opening    -$5000.00

2024-01-15 * Groceries
    Expenses:Food    $50.00
    Assets:Checking  -$50.00

2024-01-20 * Salary
    Assets:Checking    $3000.00
    Income:Salary      -$3000.00
`.trim();
    const result = parsePTA(text);
    expect(result.transactions).toHaveLength(3);
    expect(result.errors).toHaveLength(0);

    const checking = result.balances.find(b => b.account === 'Assets:Checking');
    expect(checking?.balance).toBeCloseTo(5000 - 50 + 3000);

    const food = result.balances.find(b => b.account === 'Expenses:Food');
    expect(food?.balance).toBeCloseTo(50);

    const income = result.balances.find(b => b.account === 'Income:Salary');
    expect(income?.balance).toBeCloseTo(-3000);
  });

  it('reports an error for an unbalanced transaction', () => {
    const text = `
2024-02-01 Bad Entry
    Assets:Checking    $100.00
    Expenses:Misc       $50.00
`.trim();
    const result = parsePTA(text);
    expect(result.transactions[0].isBalanced).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/unbalanced/i);
  });

  it('handles multiple transactions and sums balances correctly', () => {
    const text = `
2024-03-01 * Coffee
    Expenses:Food    $5.00
    Assets:Cash      -$5.00

2024-03-02 * Lunch
    Expenses:Food    $15.00
    Assets:Cash      -$15.00

2024-03-03 * Books
    Expenses:Education  $30.00
    Assets:Cash         -$30.00

2024-03-04 * Paycheck
    Assets:Cash        $500.00
    Income:Salary      -$500.00

2024-03-05 * Rent
    Expenses:Housing   $800.00
    Assets:Bank        -$800.00
`.trim();
    const result = parsePTA(text);
    expect(result.transactions).toHaveLength(5);
    expect(result.errors).toHaveLength(0);

    const food = result.balances.find(b => b.account === 'Expenses:Food');
    expect(food?.balance).toBeCloseTo(20);

    const cash = result.balances.find(b => b.account === 'Assets:Cash');
    expect(cash?.balance).toBeCloseTo(500 - 5 - 15 - 30);

    const housing = result.balances.find(b => b.account === 'Expenses:Housing');
    expect(housing?.balance).toBeCloseTo(800);
  });

  it('ignores comment lines', () => {
    const text = `
; This is a comment
2024-04-01 * Transfer
    ; inline comment
    Assets:Savings    $200.00
    Assets:Checking   -$200.00
`.trim();
    const result = parsePTA(text);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].postings).toHaveLength(2);
  });

  it('handles currency suffix format', () => {
    const text = `
2024-05-01 * FX Purchase
    Assets:EUR    100.00 EUR
    Assets:USD    -110.00 USD
`.trim();
    const result = parsePTA(text);
    const tx = result.transactions[0];
    expect(tx.postings[0].currency).toBe('EUR');
    expect(tx.postings[0].amount).toBeCloseTo(100);
    expect(tx.postings[1].currency).toBe('USD');
    expect(tx.postings[1].amount).toBeCloseTo(-110);
  });

  it('reports error for multiple missing amounts', () => {
    const text = `
2024-06-01 Ambiguous
    Assets:A
    Assets:B
    Assets:C    $100.00
`.trim();
    const result = parsePTA(text);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/multiple postings/i);
  });

  it('returns empty result for empty input', () => {
    const result = parsePTA('');
    expect(result.transactions).toHaveLength(0);
    expect(result.balances).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe('exportToJournal', () => {
  it('exports transactions to ledger-compatible journal format', () => {
    const text = `
2024-01-15 * Groceries
    Expenses:Food    $50.00
    Assets:Checking  -$50.00
`.trim();
    const result = parsePTA(text);
    const journal = exportToJournal(result);
    expect(journal).toContain('2024-01-15 * Groceries');
    expect(journal).toContain('Expenses:Food');
    expect(journal).toContain('Assets:Checking');
  });
});
