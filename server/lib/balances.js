// ============================================================
// Expense-splitting balance engine
// Computes per-member net balances for a trip and simplifies them
// into a minimal set of "who pays whom" settlement transactions
// (the same idea Splitwise / Spend Together use).
// All math is done in integer cents to avoid floating-point drift.
// ============================================================

const toCents = (value) => Math.round(Number(value || 0) * 100);
const toUnits = (cents) => Math.round(cents) / 100;

/**
 * Net balance per user, in cents.
 *   positive  → the user is owed money (they paid more than their share)
 *   negative  → the user owes money
 *
 * Only expenses that have a payer (`paidBy`) AND at least one split take
 * part in the calculation. Legacy/personal expenses (no payer, no splits)
 * are ignored so they don't distort the shared ledger.
 *
 * @param {Array<{amount:number, paidBy:(number|string|null), splits?:Array<{userId:(number|string), amount:number}>}>} expenses
 * @returns {Map<number, number>} userId → net balance in cents
 */
export function computeNetCents(expenses = []) {
  const net = new Map();
  const add = (userId, cents) => {
    const key = Number(userId);
    net.set(key, (net.get(key) || 0) + cents);
  };

  for (const e of expenses) {
    const splits = Array.isArray(e.splits) ? e.splits : [];
    if (e.paidBy == null || splits.length === 0) continue;

    // The payer fronted the full amount…
    add(e.paidBy, toCents(e.amount));
    // …and every participant owes their share back.
    for (const s of splits) {
      if (s.userId == null) continue;
      add(s.userId, -toCents(s.amount));
    }
  }

  return net;
}

/**
 * Greedy debt simplification. Given net balances, returns the minimal-ish
 * list of transactions that settles everyone up. Repeatedly matches the
 * biggest creditor with the biggest debtor.
 *
 * @param {Map<number, number>} netCents userId → net balance in cents
 * @returns {Array<{from:number, to:number, amount:number}>} amounts in currency units
 */
export function simplifyDebts(netCents) {
  const creditors = []; // owed money (net > 0)
  const debtors = [];   // owe money   (net < 0)

  for (const [userId, cents] of netCents.entries()) {
    if (cents > 0) creditors.push({ userId, cents });
    else if (cents < 0) debtors.push({ userId, cents: -cents });
  }

  // Largest first so we clear big balances in fewer transactions.
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const pay = Math.min(debtor.cents, creditor.cents);

    if (pay > 0) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: toUnits(pay),
      });
    }

    debtor.cents -= pay;
    creditor.cents -= pay;

    if (debtor.cents === 0) i++;
    if (creditor.cents === 0) j++;
  }

  return settlements;
}

/**
 * Full balance summary for a trip.
 *
 * @param {Array} expenses expenses with `paidBy` + `splits`
 * @param {Array<{fromUserId:(number|string), toUserId:(number|string), amount:number}>} settlements
 *   recorded "settle up" payments (from_user paid to_user) that reduce existing debts
 * @returns {{ balances: Array<{userId:number, net:number}>, settlements: Array<{from:number, to:number, amount:number}> }}
 *   - balances: net balance per involved user, in currency units
 *   - settlements: simplified "from owes to" transactions still outstanding, in currency units
 */
export function calculateBalances(expenses = [], settlements = []) {
  const netCents = computeNetCents(expenses);

  // Fold recorded settle-up payments into the net balances: the payer's debt
  // shrinks (net up), the receiver is owed less (net down).
  for (const s of settlements) {
    if (s == null || s.fromUserId == null || s.toUserId == null) continue;
    const cents = toCents(s.amount);
    const from = Number(s.fromUserId);
    const to = Number(s.toUserId);
    netCents.set(from, (netCents.get(from) || 0) + cents);
    netCents.set(to, (netCents.get(to) || 0) - cents);
  }

  const balances = [...netCents.entries()]
    .map(([userId, cents]) => ({ userId, net: toUnits(cents) }));

  return {
    balances,
    settlements: simplifyDebts(netCents),
  };
}

export default calculateBalances;
