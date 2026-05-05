import type { Institution } from "./institutions";

export type AccountType = "checking" | "savings" | "credit" | "loan";

export type MockAccount = {
  id: string;
  name: string;
  mask: string;
  type: AccountType;
  balance: number;
  currency: "USD";
};

export type MockTransaction = {
  id: string;
  posted_at: string;
  transaction_date: string;
  amount: number;
  description: string;
  memo?: string;
  category: string;
  type: "debit" | "credit";
};

export function generateAccountsFor(inst: Institution): MockAccount[] {
  const seed = inst.id.charCodeAt(0) + inst.id.charCodeAt(inst.id.length - 1);
  const rnd = (n: number) =>
    Math.round((Math.sin(seed * 9301 + n * 49297) * 10000) % 1 * 1e6) / 1e2;

  const last4 = (n: number) =>
    String(1000 + Math.abs(Math.floor(rnd(n) * 100)) % 8999);

  return [
    {
      id: `${inst.id}-chk`,
      name: "Everyday Checking",
      mask: last4(1),
      type: "checking",
      balance: 4821.34,
      currency: "USD",
    },
    {
      id: `${inst.id}-sav`,
      name: "Way2Save Savings",
      mask: last4(2),
      type: "savings",
      balance: 18230.12,
      currency: "USD",
    },
    {
      id: `${inst.id}-cc`,
      name: "Active Cash Credit Card",
      mask: last4(3),
      type: "credit",
      balance: -742.55,
      currency: "USD",
    },
    {
      id: `${inst.id}-loan`,
      name: "Auto Loan",
      mask: last4(4),
      type: "loan",
      balance: -12420.0,
      currency: "USD",
    },
  ];
}

const MERCHANTS: Array<{ d: string; c: string; m?: string; min: number; max: number; type: "debit" | "credit" }> = [
  { d: "Stripe Payout", c: "Income", min: 1200, max: 4800, type: "credit" },
  { d: "AWS — Amazon Web Services", c: "Software", m: "Cloud", min: -780, max: -120, type: "debit" },
  { d: "Vercel Inc.", c: "Software", m: "Hosting", min: -240, max: -20, type: "debit" },
  { d: "Notion Labs", c: "Software", min: -48, max: -8, type: "debit" },
  { d: "Linear", c: "Software", min: -120, max: -10, type: "debit" },
  { d: "Slack Technologies", c: "Software", min: -180, max: -12, type: "debit" },
  { d: "Apple Store", c: "Equipment", min: -1899, max: -49, type: "debit" },
  { d: "Uber Eats", c: "Meals", m: "Lunch", min: -68, max: -12, type: "debit" },
  { d: "Whole Foods Market", c: "Groceries", min: -210, max: -28, type: "debit" },
  { d: "Delta Air Lines", c: "Travel", m: "Flight", min: -1240, max: -120, type: "debit" },
  { d: "Marriott Hotels", c: "Travel", m: "Lodging", min: -680, max: -180, type: "debit" },
  { d: "Shell Oil", c: "Auto", m: "Fuel", min: -85, max: -22, type: "debit" },
  { d: "Payroll — ADP", c: "Payroll", min: -8420, max: -2400, type: "debit" },
  { d: "Customer Wire — Acme Corp", c: "Income", min: 4200, max: 18000, type: "credit" },
  { d: "Stripe Payout", c: "Income", min: 800, max: 3200, type: "credit" },
  { d: "Office supplies — Staples", c: "Office", m: "Office supplies", min: -300, max: -15, type: "debit" },
];

export function generateTransactionsFor(account: MockAccount, count = 32): MockTransaction[] {
  const out: MockTransaction[] = [];
  const seed =
    account.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 17;
  const rnd = (n: number) => {
    const x = Math.sin(seed * 4096 + n * 9301) * 10000;
    return x - Math.floor(x);
  };
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const m = MERCHANTS[Math.floor(rnd(i) * MERCHANTS.length)];
    const r = rnd(i + 100);
    const amount = Math.round((m.min + (m.max - m.min) * r) * 100) / 100;
    const date = new Date(today);
    date.setDate(today.getDate() - Math.floor(rnd(i + 200) * 60));
    const posted = new Date(date);
    posted.setDate(date.getDate() + 1);
    out.push({
      id: `txn_${account.id}_${i.toString(36)}${Math.floor(
        rnd(i + 300) * 1e6
      ).toString(36)}`,
      posted_at: posted.toISOString(),
      transaction_date: date.toISOString(),
      amount: account.type === "credit" ? -Math.abs(amount) : amount,
      description: m.d,
      memo: m.m,
      category: m.c,
      type: m.type,
    });
  }
  return out.sort(
    (a, b) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime()
  );
}

export const formatMoney = (n: number, currency: string = "USD") =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
