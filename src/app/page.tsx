"use client";
import { useMemo, useState } from "react";
import { Github, Sparkles, Webhook } from "lucide-react";
import AddAccounts from "@/components/AddAccounts";
import LoginScreen from "@/components/LoginScreen";
import AccountSelector from "@/components/AccountSelector";
import IntegrationProgress from "@/components/IntegrationProgress";
import Dashboard from "@/components/Dashboard";
import OperatorConsole from "@/components/OperatorConsole";
import QuickBooksView from "@/components/QuickBooksView";
import LaunchedFromBanner from "@/components/LaunchedFromBanner";
import { useLaunchParams } from "@/lib/launchParams";
import { Institution } from "@/lib/institutions";
import {
  MockAccount,
  MockTransaction,
  generateAccountsFor,
  generateTransactionsFor,
} from "@/lib/mockData";

type Stage =
  | "picker"
  | "login"
  | "select"
  | "progress"
  | "dashboard"
  | "operator"
  | "quickbooks";

const STAGES: Array<{ id: Stage; label: string }> = [
  { id: "picker", label: "Pick bank" },
  { id: "login", label: "Sign in" },
  { id: "select", label: "Choose accounts" },
  { id: "progress", label: "Sync via API" },
  { id: "dashboard", label: "Bank view" },
  { id: "quickbooks", label: "QuickBooks view" },
  { id: "operator", label: "Operator console" },
];

export default function Page() {
  const launch = useLaunchParams();
  const [stage, setStage] = useState<Stage>("picker");
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [allAccounts, setAllAccounts] = useState<MockAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<MockAccount[]>([]);

  const transactionsByAccount = useMemo(() => {
    const out: Record<string, MockTransaction[]> = {};
    for (const a of selectedAccounts) out[a.id] = generateTransactionsFor(a, 28);
    return out;
  }, [selectedAccounts]);

  const reset = () => {
    setStage("picker");
    setInstitution(null);
    setAllAccounts([]);
    setSelectedAccounts([]);
  };

  return (
    <main className="gradient-bg min-h-screen">
      <Header
        stage={stage}
        onReset={reset}
        onOperator={() => setStage("operator")}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Stepper
          stage={stage}
          canGoTo={(s) => {
            if (s === "operator") return true;
            if (s === "picker") return true;
            if (s === "login") return institution !== null;
            if (s === "select") return institution !== null;
            if (s === "progress")
              return institution !== null && selectedAccounts.length > 0;
            if (s === "dashboard")
              return institution !== null && selectedAccounts.length > 0;
            if (s === "quickbooks")
              return institution !== null && selectedAccounts.length > 0;
            return false;
          }}
          onJump={setStage}
        />

        <LaunchedFromBanner params={launch} />

        <div className="animate-fade-up">
          {stage === "picker" && (
            <AddAccounts
              launch={launch}
              onPick={(i) => {
                setInstitution(i);
                setAllAccounts(generateAccountsFor(i));
                setStage("login");
              }}
              onAddManual={() => alert("Manual account entry — out of scope for this demo.")}
            />
          )}

          {stage === "login" && institution && (
            <LoginScreen
              institution={institution}
              onSuccess={() => setStage("select")}
              onCancel={reset}
            />
          )}

          {stage === "select" && institution && (
            <AccountSelector
              institution={institution}
              accounts={allAccounts}
              onConfirm={(sel) => {
                setSelectedAccounts(sel);
                setStage("progress");
              }}
              onBack={() => setStage("login")}
            />
          )}

          {stage === "progress" && institution && (
            <IntegrationProgress
              institution={institution}
              accounts={selectedAccounts}
              transactionsByAccount={transactionsByAccount}
              service={launch.service ?? "xero"}
              consumerId={launch.consumerId ?? `consumer_${institution.id}`}
              onFinished={(_ctx) => setStage("dashboard")}
            />
          )}

          {stage === "dashboard" && institution && (
            <Dashboard
              institution={institution}
              accounts={selectedAccounts}
              transactionsByAccount={transactionsByAccount}
              onReset={reset}
              onOperator={() => setStage("operator")}
              onAccounting={() => setStage("quickbooks")}
            />
          )}

          {stage === "quickbooks" && institution && (
            <QuickBooksView
              institution={institution}
              accounts={selectedAccounts}
              transactionsByAccount={transactionsByAccount}
              onBack={() => setStage("dashboard")}
            />
          )}

          {stage === "operator" && (
            <OperatorConsole onBack={() => setStage("dashboard")} />
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}

function Header({
  stage,
  onReset,
  onOperator,
}: {
  stage: Stage;
  onReset: () => void;
  onOperator: () => void;
}) {
  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 flex items-center justify-between">
      <button
        onClick={onReset}
        className="group inline-flex items-center gap-2.5 select-none"
      >
        <span className="w-7 h-7 rounded-lg bg-ink-900 text-white flex items-center justify-center font-bold text-[13px] ring-1 ring-black/20 group-hover:scale-105 transition">
          A
        </span>
        <div className="text-left">
          <div className="text-[13px] font-semibold text-ink-900 leading-none">
            Apideck Bank Feeds Sync
          </div>
          <div className="text-[10px] text-ink-900/60 leading-none mt-0.5">
            Interactive demo
          </div>
        </div>
      </button>
      <div className="flex items-center gap-3">
        {stage !== "operator" && (
          <button
            onClick={onOperator}
            className="inline-flex items-center gap-1.5 text-xs text-ink-900/80 hover:text-ink-900 px-3 py-1.5 rounded-md ring-1 ring-black/10 bg-white/40 backdrop-blur"
          >
            <Webhook className="w-3.5 h-3.5" /> Operator console
          </button>
        )}
        <a
          href="https://github.com/apideck-samples/bank-feeds-sync"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-900/70 hover:text-ink-900 px-3 py-1.5 rounded-md ring-1 ring-black/10 bg-white/40 backdrop-blur"
        >
          <Github className="w-3.5 h-3.5" /> Source
        </a>
        <a
          href="https://developers.apideck.com/guides/bank-feeds-xero"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-ink-800"
        >
          <Sparkles className="w-3.5 h-3.5" /> Read the docs
        </a>
      </div>
    </header>
  );
}

function Stepper({
  stage,
  canGoTo,
  onJump,
}: {
  stage: Stage;
  canGoTo: (s: Stage) => boolean;
  onJump: (s: Stage) => void;
}) {
  const idx = STAGES.findIndex((s) => s.id === stage);
  return (
    <div className="mb-6 flex items-center gap-2 text-[11px] text-ink-900/70 overflow-x-auto pb-1">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        const reachable = canGoTo(s.id);
        return (
          <div key={s.id} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!reachable || current}
              onClick={() => onJump(s.id)}
              title={
                reachable
                  ? `Jump to ${s.label}`
                  : "Complete the earlier steps first"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 transition ${
                current
                  ? "bg-ink-900 text-white ring-ink-900 cursor-default"
                  : done
                    ? "bg-white/70 text-ink-900 ring-black/10 hover:bg-white hover:ring-black/20"
                    : reachable
                      ? "bg-white/40 text-ink-900/80 ring-black/10 hover:bg-white/70"
                      : "bg-white/30 text-ink-900/60 ring-black/10 cursor-not-allowed opacity-60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  current
                    ? "bg-white"
                    : done
                      ? "bg-emerald-500"
                      : "bg-ink-900/30"
                }`}
              />
              {i + 1}. {s.label}
            </button>
            {i < STAGES.length - 1 && (
              <span className="w-3 h-px bg-ink-900/20" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 text-center text-[11px] text-ink-900/60">
      Built with Next.js · Mirrors the Apideck Bank Feeds API surface
    </footer>
  );
}
