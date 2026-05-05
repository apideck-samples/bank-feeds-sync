"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import MacWindow from "./MacWindow";
import InstitutionLogo from "./InstitutionLogo";
import {
  getProspectInstitution,
  Institution,
  POPULAR_INSTITUTIONS,
} from "@/lib/institutions";
import { useDynamicInstitutions } from "@/lib/useDynamicInstitutions";

export default function AddAccounts({
  onPick,
  onAddManual,
  onBack,
}: {
  onPick: (i: Institution) => void;
  onAddManual: () => void;
  onBack?: () => void;
}) {
  const [query, setQuery] = useState("");
  const allInstitutions = useMemo(() => {
    const prospect = getProspectInstitution();
    return prospect ? [prospect, ...POPULAR_INSTITUTIONS] : POPULAR_INSTITUTIONS;
  }, []);
  const { institutions, loadingIds } = useDynamicInstitutions(allInstitutions);
  const filtered = useMemo(() => {
    if (!query.trim()) return institutions;
    const q = query.toLowerCase();
    return institutions.filter(
      (i) => i.name.toLowerCase().includes(q) || i.id.includes(q)
    );
  }, [query, institutions]);

  return (
    <MacWindow
      title="Add Accounts"
      className="w-full"
      footer={
        <>
          <button
            type="button"
            onClick={onAddManual}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-200 hover:bg-ink-600 ring-1 ring-white/5"
          >
            Add an Account
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            <span className="w-2 h-2 rounded-full bg-white/15" />
            <span className="w-2 h-2 rounded-full bg-white/15" />
          </div>
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-400 disabled:opacity-50 ring-1 ring-white/5"
          >
            Back
          </button>
        </>
      }
    >
      <div className="px-10 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-50 text-center">
          Add all your accounts
        </h1>
        <p className="text-zinc-400 mt-3 text-center max-w-2xl mx-auto">
          Adding accounts and having accurate categories are key to unlocking
          all the features.
        </p>

        <div className="mt-10 grid md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-10">
          {/* LEFT: nested search window */}
          <div>
            <h2 className="text-zinc-100 font-semibold mb-2">
              Nothing happens without accounts to track
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Transactions are the building blocks of bank feeds. Nothing
              happens until you set up your accounts and start adding
              transactions to them, either manually or by downloading
              transactions from your financial institution.
            </p>

            <div className="mt-6">
              <MacWindow
                title="Add Accounts"
                size="md"
                className="bg-ink-800"
                contentClassName="p-5"
              >
                <h3 className="text-zinc-50 text-lg font-semibold">
                  Search for your financial institution
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Connect your Savings, Checking, Credit Card, Brokerage, and
                  Loan accounts
                </p>

                <label
                  className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700/70 ring-1 ring-accent-500/40 focus-within:ring-2 focus-within:ring-accent-500"
                >
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search from 14000+ supported institutions"
                    className="bg-transparent flex-1 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                  />
                </label>

                <p className="text-xs text-zinc-400 mt-4 mb-2">
                  Or choose from this list of popular financial institutions..
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 dark-scroll">
                  {filtered.map((i) => {
                    const loading = loadingIds.has(i.id);
                    return (
                      <button
                        key={i.id}
                        onClick={() => onPick(i)}
                        className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-ink-700/60 hover:bg-ink-600 ring-1 ring-white/5 hover:ring-accent-500/50 transition text-left"
                      >
                        <InstitutionLogo institution={i} size={32} />
                        <span className="text-sm text-zinc-100 truncate flex-1">
                          {i.short || i.name}
                        </span>
                        {i.dynamic && (
                          <span
                            title={
                              loading
                                ? `Fetching live brand from ${i.dynamic.domain}…`
                                : `Live brand fetched from ${i.dynamic.domain}`
                            }
                            className="shrink-0 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ring-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          >
                            {loading ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                            Live
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="col-span-2 text-center text-xs text-zinc-500 py-8">
                      No institutions match &ldquo;{query}&rdquo;
                    </div>
                  )}
                </div>
              </MacWindow>
            </div>
          </div>

          {/* RIGHT: tooltip-style call-out + descriptive copy */}
          <div className="space-y-6">
            <div className="relative">
              <div className="rounded-2xl bg-accent-500 text-white p-5 shadow-card animate-fade-up">
                <p className="text-sm leading-relaxed">
                  Your users can select their financial institution from
                  Apideck&apos;s comprehensive list for seamless access.
                </p>
                <button
                  className="mt-4 inline-flex items-center justify-center w-9 h-9 rounded-md bg-white text-accent-600 hover:scale-105 transition"
                  onClick={() => onPick(POPULAR_INSTITUTIONS[0])}
                  aria-label="Continue"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-zinc-300 text-sm space-y-3">
              <h3 className="text-zinc-100 font-semibold">
                Connect all your accounts
              </h3>
              <p>
                Connected accounts download your transactions directly from the
                financial institution, saving you the time you would spend
                entering them yourself. By connecting your accounts you are
                less likely to make mistakes than entering the transactions
                manually.
              </p>
              <h3 className="text-zinc-100 font-semibold pt-3">
                Apideck works with over 14,000 financial institutions to connect
                your accounts online.
              </h3>
            </div>
          </div>
        </div>
      </div>
    </MacWindow>
  );
}
