"use client";
import { useMemo, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Filter,
  HelpCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { Institution } from "@/lib/institutions";
import {
  MockAccount,
  MockTransaction,
  formatDate,
  formatMoney,
} from "@/lib/mockData";

type Status = "review" | "categorized" | "excluded";

type Row = {
  txn: MockTransaction;
  status: Status;
  // Category suggested from the transaction's `category` field — user can
  // accept or change it.
  suggestedCategory: string;
  payee: string;
  matched: boolean;
};

const QBO_CATEGORIES = [
  "Office expense",
  "Software & subscriptions",
  "Meals & entertainment",
  "Travel",
  "Vehicle: fuel",
  "Vehicle expense",
  "Bank service charges",
  "Sales of product income",
  "Service revenue",
  "Wages & salaries",
  "Cost of goods sold",
  "Equipment",
  "Insurance",
  "Utilities",
  "Rent or lease",
  "Loan repayment",
  "Owner's draw",
  "Refund",
  "Interest earned",
  "Uncategorized",
];

function suggestCategory(t: MockTransaction): string {
  switch (t.category) {
    case "Software":
      return "Software & subscriptions";
    case "Office":
      return "Office expense";
    case "Meals":
      return "Meals & entertainment";
    case "Travel":
      return "Travel";
    case "Auto":
      return "Vehicle: fuel";
    case "Groceries":
      return "Meals & entertainment";
    case "Equipment":
      return "Equipment";
    case "Payroll":
      return "Wages & salaries";
    case "Income":
      return "Sales of product income";
    default:
      return "Uncategorized";
  }
}

function suggestPayee(t: MockTransaction): string {
  // First few words of the description without trailing punctuation.
  return t.description.split(" — ")[0].split(" - ")[0].split(",")[0];
}

export default function QuickBooksView({
  institution,
  accounts,
  transactionsByAccount,
  onBack,
}: {
  institution: Institution;
  accounts: MockAccount[];
  transactionsByAccount: Record<string, MockTransaction[]>;
  onBack: () => void;
}) {
  const [activeId, setActiveId] = useState(accounts[0]?.id);
  const [tab, setTab] = useState<Status>("review");
  const [filter, setFilter] = useState("");

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0];
  const txns = active ? transactionsByAccount[active.id] ?? [] : [];

  const initialRows = useMemo<Row[]>(
    () =>
      txns.map((t, i) => ({
        txn: t,
        // Sprinkle a few already-categorized so each tab has something.
        status: i < 3 ? "categorized" : "review",
        suggestedCategory: suggestCategory(t),
        payee: suggestPayee(t),
        matched: i % 7 === 2,
      })),
    [txns]
  );

  const [rows, setRows] = useState<Row[]>(initialRows);
  // Reset rows when the underlying data changes
  useMemo(() => setRows(initialRows), [initialRows]);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((r) => (r.txn.id === id ? { ...r, ...patch } : r))
    );

  const accept = (id: string) =>
    updateRow(id, { status: "categorized" });

  const exclude = (id: string) => updateRow(id, { status: "excluded" });

  const filtered = rows
    .filter((r) => r.status === tab)
    .filter((r) =>
      filter.trim()
        ? r.txn.description.toLowerCase().includes(filter.toLowerCase()) ||
          r.payee.toLowerCase().includes(filter.toLowerCase())
        : true
    );

  const counts = {
    review: rows.filter((r) => r.status === "review").length,
    categorized: rows.filter((r) => r.status === "categorized").length,
    excluded: rows.filter((r) => r.status === "excluded").length,
  };

  return (
    <div className="rounded-2xl bg-white shadow-window ring-1 ring-black/5 overflow-hidden text-zinc-900">
      {/* QBO-style top bar */}
      <div className="bg-[#2CA01C] text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white text-[#2CA01C] flex items-center justify-center font-bold text-[12px]">
            qb
          </div>
          <span className="font-semibold tracking-tight">QuickBooks</span>
          <span className="text-white/60 text-[11px] ml-1">Bank feeds preview</span>
        </div>
        <button
          onClick={onBack}
          className="text-[11px] px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 ring-1 ring-white/30"
        >
          ← Back to bank view
        </button>
      </div>

      <div className="grid md:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar: bank-feed accounts with for-review counts */}
        <aside className="border-r border-zinc-200 p-4 bg-zinc-50">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
            <span>Bank feed accounts</span>
            <Filter className="w-3 h-3" />
          </div>
          <div className="space-y-1">
            {accounts.map((a) => {
              const all = transactionsByAccount[a.id] ?? [];
              const reviewCount = Math.max(0, all.length - 3);
              const isActive = a.id === active?.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition ${
                    isActive
                      ? "bg-[#2CA01C]/10 ring-1 ring-[#2CA01C]/30"
                      : "hover:bg-zinc-100"
                  }`}
                >
                  <CircleDot
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-[#2CA01C]" : "text-zinc-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">
                      {institution.short || institution.name} {a.name}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      ••{a.mask} · {a.type}
                    </div>
                  </div>
                  {reviewCount > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2CA01C] text-white whitespace-nowrap">
                      {reviewCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg bg-white ring-1 ring-zinc-200 p-3">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
              Connected via
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                A
              </div>
              <div className="text-[12px] leading-tight">
                <div className="font-medium">Apideck Bank Feeds Sync</div>
                <div className="text-zinc-500">Pushed via API</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main panel */}
        <section className="p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight">
              {active?.name}
            </h1>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-100 ring-1 ring-zinc-200 text-zinc-600">
              ••{active?.mask}
            </span>
            <span className="ml-auto text-[12px] text-zinc-500 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2CA01C]" />
              Auto-categorized by Apideck rules
            </span>
          </div>

          <div className="mt-1 text-[12px] text-zinc-500">
            Last statement received{" "}
            <span className="text-zinc-700 font-medium">just now</span> · Bank
            balance{" "}
            <span className="text-zinc-700 font-medium">
              {active && formatMoney(active.balance)}
            </span>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex items-end gap-1 border-b border-zinc-200">
            {(
              [
                ["review", "For review", counts.review],
                ["categorized", "Categorized", counts.categorized],
                ["excluded", "Excluded", counts.excluded],
              ] as const
            ).map(([id, label, n]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-2 text-[13px] -mb-px border-b-2 transition ${
                  tab === id
                    ? "border-[#2CA01C] text-[#2CA01C] font-medium"
                    : "border-transparent text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === id
                      ? "bg-[#2CA01C]/10 text-[#2CA01C]"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {n}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white ring-1 ring-zinc-200 flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search payee or description…"
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-zinc-400"
              />
            </label>
            {tab === "review" && filtered.length > 0 && (
              <button
                onClick={() =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.status === "review"
                        ? { ...r, status: "categorized" }
                        : r
                    )
                  )
                }
                className="ml-auto inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-[#2CA01C] hover:bg-[#268C18] text-white"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Accept all{" "}
                {counts.review > 0 ? `(${counts.review})` : ""}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="mt-3 rounded-lg ring-1 ring-zinc-200 overflow-hidden">
            <div className="grid grid-cols-[100px_1fr_180px_120px_180px] text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-50 border-b border-zinc-200">
              <span className="px-3 py-2">Date</span>
              <span className="px-3 py-2">Description / Payee</span>
              <span className="px-3 py-2">Category</span>
              <span className="px-3 py-2 text-right">Amount</span>
              <span className="px-3 py-2 text-right">Action</span>
            </div>
            <div className="max-h-[460px] overflow-y-auto bg-white">
              {filtered.map((r) => (
                <RowView
                  key={r.txn.id}
                  row={r}
                  onCategoryChange={(c) =>
                    updateRow(r.txn.id, { suggestedCategory: c })
                  }
                  onAccept={() => accept(r.txn.id)}
                  onExclude={() => exclude(r.txn.id)}
                  tab={tab}
                />
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-12 text-center text-sm text-zinc-500">
                  Nothing here. Try another tab.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-zinc-500 inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            This view simulates QuickBooks Online&apos;s Banking page. In
            production the Apideck-pushed statements land here automatically —
            users only need to <em>review &amp; accept</em>.
          </div>
        </section>
      </div>
    </div>
  );
}

function RowView({
  row,
  onCategoryChange,
  onAccept,
  onExclude,
  tab,
}: {
  row: Row;
  onCategoryChange: (c: string) => void;
  onAccept: () => void;
  onExclude: () => void;
  tab: Status;
}) {
  const [expanded, setExpanded] = useState(false);
  const isCredit = row.txn.amount >= 0;

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <div className="grid grid-cols-[100px_1fr_180px_120px_180px] items-center hover:bg-zinc-50">
        <span className="px-3 py-2.5 text-[12px] text-zinc-700 whitespace-nowrap">
          {formatDate(row.txn.transaction_date)}
        </span>
        <button
          onClick={() => setExpanded((x) => !x)}
          className="px-3 py-2.5 text-left flex items-center gap-1.5 min-w-0"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[13px] truncate">{row.payee}</div>
            <div className="text-[11px] text-zinc-500 truncate">
              {row.txn.description}
              {row.matched && tab === "review" && (
                <span className="ml-1.5 text-[10px] text-[#2CA01C] font-medium">
                  • Possible match found
                </span>
              )}
            </div>
          </div>
        </button>
        <span className="px-3 py-2.5">
          {tab === "review" ? (
            <select
              value={row.suggestedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full text-[12px] bg-white ring-1 ring-zinc-200 rounded px-2 py-1 outline-none focus:ring-[#2CA01C]"
            >
              {QBO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[12px] text-zinc-700">
              {row.suggestedCategory}
            </span>
          )}
        </span>
        <span
          className={`px-3 py-2.5 text-right text-[13px] tabular-nums font-medium ${
            isCredit ? "text-emerald-600" : "text-zinc-900"
          }`}
        >
          {isCredit ? "+" : "−"}
          {formatMoney(Math.abs(row.txn.amount))}
        </span>
        <span className="px-3 py-2.5 flex items-center gap-1.5 justify-end">
          {tab === "review" ? (
            <>
              <button
                onClick={onAccept}
                className="text-[11px] px-2.5 py-1.5 rounded-md bg-[#2CA01C] hover:bg-[#268C18] text-white font-medium"
              >
                {row.matched ? "Match" : "Add"}
              </button>
              <button
                onClick={onExclude}
                className="text-[11px] px-2 py-1.5 rounded-md bg-white ring-1 ring-zinc-200 hover:bg-zinc-50 text-zinc-600"
              >
                Exclude
              </button>
            </>
          ) : tab === "categorized" ? (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-1.5 py-0.5 rounded">
              In QuickBooks
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 bg-zinc-50 ring-1 ring-zinc-200 px-1.5 py-0.5 rounded">
              Excluded
            </span>
          )}
        </span>
      </div>
      {expanded && (
        <div className="px-12 pb-3 text-[12px] text-zinc-600 grid grid-cols-3 gap-3 bg-zinc-50/60">
          <KV label="Source txn id" value={row.txn.id} mono />
          <KV label="Memo" value={row.txn.memo ?? "—"} />
          <KV
            label="Direction"
            value={row.txn.amount >= 0 ? "CREDIT" : "DEBIT"}
          />
        </div>
      )}
    </div>
  );
}

function KV({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`text-[12px] ${mono ? "font-mono" : ""} text-zinc-700 truncate`}
      >
        {value}
      </div>
    </div>
  );
}
