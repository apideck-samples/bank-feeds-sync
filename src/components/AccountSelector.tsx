"use client";
import { useState } from "react";
import { Banknote, CreditCard, Landmark, PiggyBank, ShieldCheck } from "lucide-react";
import MacWindow from "./MacWindow";
import InstitutionLogo from "./InstitutionLogo";
import { Institution } from "@/lib/institutions";
import { MockAccount, formatMoney } from "@/lib/mockData";

const ICONS: Record<MockAccount["type"], React.ComponentType<{ className?: string }>> = {
  checking: Banknote,
  savings: PiggyBank,
  credit: CreditCard,
  loan: Landmark,
};

const TYPE_LABEL: Record<MockAccount["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  loan: "Loan",
};

export default function AccountSelector({
  institution,
  accounts,
  onConfirm,
  onBack,
}: {
  institution: Institution;
  accounts: MockAccount[];
  onConfirm: (selected: MockAccount[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(accounts.filter((a) => a.type !== "loan").map((a) => a.id))
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = accounts.filter((a) => selected.has(a.id));

  return (
    <MacWindow
      title={`Select accounts — ${institution.short || institution.name}`}
      footer={
        <>
          <button
            type="button"
            onClick={onBack}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5"
          >
            Back
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-500/70" />
            <span className="w-2 h-2 rounded-full bg-accent-500/70" />
            <span className="w-2 h-2 rounded-full bg-accent-500" />
          </div>
          <button
            type="button"
            disabled={chosen.length === 0}
            onClick={() => onConfirm(chosen)}
            className="text-xs px-4 py-1.5 rounded-md bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Link {chosen.length} account{chosen.length === 1 ? "" : "s"}
          </button>
        </>
      }
    >
      <div className="px-10 py-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <InstitutionLogo institution={institution} size={48} />
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">
              Select accounts to share
            </h1>
            <p className="text-sm text-zinc-400">
              Apideck will only sync transactions for the accounts you select.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-white/5 rounded-xl ring-1 ring-white/5 overflow-hidden bg-ink-800/60">
          {accounts.map((a) => {
            const Icon = ICONS[a.type];
            const checked = selected.has(a.id);
            return (
              <label
                key={a.id}
                className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition ${
                  checked ? "bg-accent-500/10" : "hover:bg-white/[0.03]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(a.id)}
                  className="w-4 h-4 accent-accent-500"
                />
                <div className="w-9 h-9 rounded-lg bg-ink-700 ring-1 ring-white/10 flex items-center justify-center text-zinc-300">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-100 truncate">{a.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {TYPE_LABEL[a.type]} · ••{a.mask}
                  </div>
                </div>
                <div
                  className={`text-sm tabular-nums font-medium ${
                    a.balance < 0 ? "text-rose-300" : "text-emerald-300"
                  }`}
                >
                  {formatMoney(a.balance)}
                </div>
              </label>
            );
          })}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          Your data is encrypted in transit and at rest. Apideck never stores
          your bank credentials.
        </p>
      </div>
    </MacWindow>
  );
}
