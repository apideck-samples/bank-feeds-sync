"use client";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, FileSpreadsheet, RefreshCw, Sparkles, Webhook } from "lucide-react";
import MacWindow from "./MacWindow";
import InstitutionLogo from "./InstitutionLogo";
import { Institution } from "@/lib/institutions";
import {
  MockAccount,
  MockTransaction,
  formatDate,
  formatMoney,
} from "@/lib/mockData";

export default function Dashboard({
  institution,
  accounts,
  transactionsByAccount,
  onReset,
  onOperator,
  onAccounting,
}: {
  institution: Institution;
  accounts: MockAccount[];
  transactionsByAccount: Record<string, MockTransaction[]>;
  onReset: () => void;
  onOperator: () => void;
  onAccounting: () => void;
}) {
  const [activeId, setActiveId] = useState(accounts[0]?.id);
  const active =
    accounts.find((a) => a.id === activeId) ?? accounts[0] ?? null;
  const txns = active ? transactionsByAccount[active.id] ?? [] : [];

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const t of txns) {
      if (t.amount >= 0) inflow += t.amount;
      else outflow += Math.abs(t.amount);
    }
    return { inflow, outflow };
  }, [txns]);

  return (
    <MacWindow
      title={`Connected — ${institution.short || institution.name}`}
      footer={
        <>
          <button
            type="button"
            onClick={onReset}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Run again
          </button>
          <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live — receiving transactions
          </span>
          <span className="text-[11px] text-zinc-500">
            Apideck Bank Feeds Sync · v2026-05
          </span>
        </>
      }
    >
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <InstitutionLogo institution={institution} size={56} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-50">
                {institution.name}
              </h1>
              <span className="text-[11px] px-1.5 py-0.5 rounded ring-1 ring-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                Connected
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Syncing {accounts.length} account{accounts.length === 1 ? "" : "s"} · OAuth
              session · refresh every 4h
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-400 bg-ink-700/60 ring-1 ring-white/5 rounded-lg px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Try clicking another account
            </div>
            <button
              type="button"
              onClick={onAccounting}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[#2CA01C]/15 ring-1 ring-[#2CA01C]/30 text-[#2CA01C] hover:bg-[#2CA01C]/25 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              QuickBooks view →
            </button>
            <button
              type="button"
              onClick={onOperator}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent-500/15 ring-1 ring-accent-500/30 text-accent-500 hover:bg-accent-500/25 whitespace-nowrap"
            >
              <Webhook className="w-3.5 h-3.5" />
              Operator console →
            </button>
          </div>
        </div>

        {/* Account picker */}
        <div className="grid md:grid-cols-[260px_minmax(0,1fr)] gap-6 mt-8">
          <div className="space-y-1.5">
            {accounts.map((a) => {
              const isActive = a.id === active?.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg ring-1 transition ${
                    isActive
                      ? "bg-accent-500/15 ring-accent-500/40"
                      : "bg-ink-800/60 ring-white/5 hover:bg-ink-700/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-100 truncate">
                      {a.name}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${
                        a.balance < 0 ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {formatMoney(a.balance)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {a.type} · ••{a.mask}
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Inflow (60d)"
                value={formatMoney(totals.inflow)}
                tone="up"
              />
              <Stat
                label="Outflow (60d)"
                value={formatMoney(totals.outflow)}
                tone="down"
              />
              <Stat
                label="Transactions"
                value={txns.length.toString()}
                tone="neutral"
              />
            </div>

            {/* Transactions */}
            <div className="mt-5 rounded-xl ring-1 ring-white/5 overflow-hidden bg-ink-800/60">
              <div className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 grid grid-cols-[1fr_auto] border-b border-white/5">
                <span>Recent transactions</span>
                <span className="tabular-nums">Amount</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto dark-scroll">
                {txns.map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-100 truncate">
                        {t.description}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {formatDate(t.transaction_date)} · {t.category}
                        {t.memo ? ` · ${t.memo}` : ""}
                      </div>
                    </div>
                    <div
                      className={`tabular-nums text-sm font-medium ${
                        t.amount < 0 ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {t.amount < 0 ? "−" : "+"}
                      {formatMoney(Math.abs(t.amount))}
                    </div>
                  </div>
                ))}
                {txns.length === 0 && (
                  <div className="text-center text-xs text-zinc-500 py-10">
                    No transactions yet for this account.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MacWindow>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "up" | "down" | "neutral";
}) {
  const Icon =
    tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : null;
  const color =
    tone === "up"
      ? "text-emerald-300"
      : tone === "down"
        ? "text-rose-300"
        : "text-zinc-200";
  return (
    <div className="rounded-xl bg-ink-800/60 ring-1 ring-white/5 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${color}`}>
        {Icon && <Icon className="inline-block w-4 h-4 mr-1 -mt-0.5" />}
        {value}
      </div>
    </div>
  );
}
