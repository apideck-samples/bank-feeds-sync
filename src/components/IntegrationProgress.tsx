"use client";
import { useState } from "react";
import { Check, ChevronDown, CircleDashed, Loader2 } from "lucide-react";
import MacWindow from "./MacWindow";
import MockApiCall, { ApiResult } from "./MockApiCall";
import { Institution } from "@/lib/institutions";
import { MockAccount, MockTransaction } from "@/lib/mockData";

type StepId =
  | "vault-session"
  | "vault-link"
  | "bf-account"
  | "bf-statement"
  | "complete";

type StepState = "idle" | "running" | "done";

const STEP_ORDER: StepId[] = [
  "vault-session",
  "vault-link",
  "bf-account",
  "bf-statement",
  "complete",
];

const SERVICE_LABEL: Record<string, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks Online",
  sage: "Sage",
  freshbooks: "FreshBooks",
};

function buildHeaders(service: string, consumerId: string) {
  return {
    Authorization: "Bearer ${APIDECK_API_KEY}",
    "x-apideck-app-id": "${APIDECK_APP_ID}",
    "x-apideck-consumer-id": consumerId,
    "x-apideck-service-id": service,
    "Content-Type": "application/json",
  } as const;
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function IntegrationProgress({
  institution,
  accounts,
  transactionsByAccount,
  service = "xero",
  consumerId = "demo-consumer",
  onFinished,
}: {
  institution: Institution;
  accounts: MockAccount[];
  transactionsByAccount: Record<string, MockTransaction[]>;
  service?: "xero" | "quickbooks" | "sage" | "freshbooks";
  consumerId?: string;
  onFinished: (ctx: {
    bankFeedAccountIds: Record<string, string>;
  }) => void;
}) {
  const APIDECK_HEADERS = buildHeaders(service, consumerId);
  const serviceName = SERVICE_LABEL[service] ?? "Xero";
  const [openStep, setOpenStep] = useState<StepId>("vault-session");
  const [stepState, setStepState] = useState<Record<StepId, StepState>>({
    "vault-session": "idle",
    "vault-link": "idle",
    "bf-account": "idle",
    "bf-statement": "idle",
    complete: "idle",
  });

  const [sessionResult, setSessionResult] = useState<ApiResult>({ state: "idle" });
  const [accountResult, setAccountResult] = useState<ApiResult>({ state: "idle" });
  const [statementResult, setStatementResult] = useState<ApiResult>({ state: "idle" });

  const [sessionUri, setSessionUri] = useState("");
  // Map from local account id -> Apideck bank_feed_account_id
  const [bfaIds, setBfaIds] = useState<Record<string, string>>({});

  const advance = (from: StepId) => {
    const idx = STEP_ORDER.indexOf(from);
    setStepState((s) => ({ ...s, [from]: "done" }));
    const next = STEP_ORDER[idx + 1];
    if (next) setOpenStep(next);
  };

  const callApi = async (
    setter: (r: ApiResult) => void,
    method: "GET" | "POST",
    path: string,
    body?: unknown
  ) => {
    setter({ state: "running" });
    const start = performance.now();
    try {
      const r = await fetch(`/api/apideck/${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          "x-apideck-app-id": "demo-app-id",
          "x-apideck-consumer-id": consumerId,
          "x-apideck-service-id": service,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      const ms = Math.round(performance.now() - start);
      setter({ state: r.ok ? "success" : "error", status: r.status, data, ms });
      return { ok: r.ok, data };
    } catch (e: any) {
      const ms = Math.round(performance.now() - start);
      setter({
        state: "error",
        status: 0,
        data: { error: String(e?.message || e) },
        ms,
      });
      return { ok: false, data: null as any };
    }
  };

  const runVaultSession = async () => {
    setStepState((s) => ({ ...s, "vault-session": "running" }));
    const { ok, data } = await callApi(
      setSessionResult,
      "POST",
      "vault/sessions",
      {
        consumer_metadata: {
          account_name: institution.name,
          user_name: "Demo User",
          email: "demo@example.com",
        },
        redirect_uri: "https://your-app.com/login/success",
      }
    );
    if (ok) {
      setSessionUri(data.data.session_uri);
      advance("vault-session");
    } else setStepState((s) => ({ ...s, "vault-session": "idle" }));
  };

  const runVaultLink = () => {
    // Simulated user step — clicking the Vault link, authorizing Xero,
    // returning to the host app with an active connection.
    setStepState((s) => ({ ...s, "vault-link": "running" }));
    setTimeout(() => advance("vault-link"), 900);
  };

  const runCreateAccount = async () => {
    setStepState((s) => ({ ...s, "bf-account": "running" }));
    const ids: Record<string, string> = {};
    let lastResult: any = null;
    for (const a of accounts) {
      const { ok, data } = await callApi(
        setAccountResult,
        "POST",
        "accounting/bank-feed-accounts",
        {
          bankFeedAccount: {
            source_account_id: a.id,
            target_account_name: `${institution.short || institution.name} ${a.name}`,
            target_account_number: `••••${a.mask}`,
            bank_account_type:
              a.type === "credit"
                ? "credit_card"
                : a.type === "loan"
                  ? "loan"
                  : "bank",
            currency: a.currency,
          },
        }
      );
      lastResult = data;
      if (!ok) {
        setStepState((s) => ({ ...s, "bf-account": "idle" }));
        return;
      }
      ids[a.id] = data.data.id;
    }
    setBfaIds(ids);
    advance("bf-account");
  };

  const runCreateStatement = async () => {
    setStepState((s) => ({ ...s, "bf-statement": "running" }));
    for (const a of accounts) {
      const txns = transactionsByAccount[a.id] ?? [];
      if (txns.length === 0) continue;
      const dates = txns.map((t) => new Date(t.transaction_date));
      const start = new Date(Math.min(...dates.map((d) => d.getTime())));
      const end = new Date(Math.max(...dates.map((d) => d.getTime())));
      const inflow = txns
        .filter((t) => t.amount > 0)
        .reduce((n, t) => n + t.amount, 0);
      const outflow = txns
        .filter((t) => t.amount < 0)
        .reduce((n, t) => n + Math.abs(t.amount), 0);

      const startBalance = a.balance - inflow + outflow;
      const endBalance = a.balance;

      const { ok } = await callApi(
        setStatementResult,
        "POST",
        "accounting/bank-feed-statements",
        {
          bankFeedStatement: {
            bank_feed_account_id: bfaIds[a.id],
            start_date: fmtDate(start),
            end_date: fmtDate(end),
            start_balance: Math.abs(Math.round(startBalance * 100) / 100),
            start_balance_credit_or_debit: startBalance >= 0 ? "CREDIT" : "DEBIT",
            end_balance: Math.abs(Math.round(endBalance * 100) / 100),
            end_balance_credit_or_debit: endBalance >= 0 ? "CREDIT" : "DEBIT",
            transactions: txns.map((t) => ({
              source_transaction_id: t.id,
              posted_date: t.posted_at.slice(0, 10),
              description: t.description,
              amount: Math.abs(t.amount),
              credit_or_debit: t.amount >= 0 ? "CREDIT" : "DEBIT",
              counterparty: t.description,
              reference: t.memo ?? null,
              transaction_type: t.category.toLowerCase(),
            })),
          },
        }
      );
      if (!ok) {
        setStepState((s) => ({ ...s, "bf-statement": "idle" }));
        return;
      }
    }
    advance("bf-statement");
  };

  const runComplete = () => {
    setStepState((s) => ({ ...s, complete: "done" }));
    onFinished({ bankFeedAccountIds: bfaIds });
  };

  // Build the request body preview for the bank-feed-statements call so it
  // shows the same shape the user would post for real.
  const previewAccount = accounts[0];
  const previewTxn = previewAccount
    ? transactionsByAccount[previewAccount.id]?.[0]
    : null;

  return (
    <MacWindow
      title={`Apideck Bank Feeds Sync — ${serviceName} integration`}
    >
      <div className="px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-50">
            Bank feed integration progress
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Walk through the same Apideck Bank Feeds API calls used in the
            <a
              href="https://developers.apideck.com/guides/bank-feeds-xero"
              target="_blank"
              rel="noreferrer"
              className="text-accent-500 hover:underline ml-1"
            >
              {serviceName} integration guide
            </a>
            . Calls hit a local mock that mirrors the real request &amp;
            response shapes.
          </p>
        </div>

        <div className="space-y-3">
          <Step
            id="vault-session"
            title="Step 1 — Create an Apideck Vault session"
            state={stepState["vault-session"]}
            open={openStep === "vault-session"}
            onToggle={() =>
              setOpenStep(
                openStep === "vault-session" ? ("" as any) : "vault-session"
              )
            }
          >
            <p className="text-sm text-zinc-300 mb-3">
              Vault sessions hand the customer a hosted link where they
              authorize their accounting platform ({serviceName}) without ever sharing
              credentials with your app.
            </p>
            <MockApiCall
              method="POST"
              endpoint="https://unify.apideck.com/vault/sessions"
              headers={APIDECK_HEADERS}
              body={{
                consumer_metadata: {
                  account_name: institution.name,
                  user_name: "Demo User",
                  email: "demo@example.com",
                },
                redirect_uri: "https://your-app.com/login/success",
              }}
              result={sessionResult}
              onRun={runVaultSession}
            />
          </Step>

          <Step
            id="vault-link"
            title={`Step 2 — Customer authorizes ${serviceName} in Vault`}
            state={stepState["vault-link"]}
            open={openStep === "vault-link"}
            onToggle={() =>
              setOpenStep(
                openStep === "vault-link" ? ("" as any) : "vault-link"
              )
            }
            disabled={sessionResult.state !== "success"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              Redirect the customer to the session URI returned above. They
              sign in to {serviceName}, grant access, and Apideck redirects them back to
              your app with an active connection.
            </p>
            <div className="font-mono text-[11px] text-zinc-300 bg-zinc-950 ring-1 ring-white/10 rounded-md px-3 py-2 break-all mb-3">
              {sessionUri || "<from step 1>"}
            </div>
            <button
              type="button"
              onClick={runVaultLink}
              disabled={!sessionUri || stepState["vault-link"] === "running"}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm disabled:opacity-50"
            >
              {stepState["vault-link"] === "running" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Open Vault link &amp; authorize
            </button>
          </Step>

          <Step
            id="bf-account"
            title="Step 3 — Create bank feed accounts"
            state={stepState["bf-account"]}
            open={openStep === "bf-account"}
            onToggle={() =>
              setOpenStep(
                openStep === "bf-account" ? ("" as any) : "bf-account"
              )
            }
            disabled={stepState["vault-link"] !== "done"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              Register each linked account in {serviceName} by posting to{" "}
              <code className="text-accent-500">
                /accounting/bank-feed-accounts
              </code>
              . The call is idempotent on{" "}
              <code className="text-accent-500">source_account_id</code>.
            </p>
            <MockApiCall
              method="POST"
              endpoint="https://unify.apideck.com/accounting/bank-feed-accounts"
              headers={APIDECK_HEADERS}
              body={
                previewAccount && {
                  bankFeedAccount: {
                    source_account_id: previewAccount.id,
                    target_account_name: `${
                      institution.short || institution.name
                    } ${previewAccount.name}`,
                    target_account_number: `••••${previewAccount.mask}`,
                    bank_account_type:
                      previewAccount.type === "credit"
                        ? "credit_card"
                        : previewAccount.type === "loan"
                          ? "loan"
                          : "bank",
                    currency: previewAccount.currency,
                  },
                  _note:
                    accounts.length > 1
                      ? `One call per account — ${accounts.length} total. Showing the first.`
                      : undefined,
                }
              }
              result={accountResult}
              onRun={runCreateAccount}
            />
          </Step>

          <Step
            id="bf-statement"
            title="Step 4 — Push a bank feed statement"
            state={stepState["bf-statement"]}
            open={openStep === "bf-statement"}
            onToggle={() =>
              setOpenStep(
                openStep === "bf-statement" ? ("" as any) : "bf-statement"
              )
            }
            disabled={stepState["bf-account"] !== "done"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              Push transactions for each registered account by posting a
              statement to{" "}
              <code className="text-accent-500">
                /accounting/bank-feed-statements
              </code>
              . Each statement carries opening/closing balances plus a batch
              of transactions for a date range.
            </p>
            <MockApiCall
              method="POST"
              endpoint="https://unify.apideck.com/accounting/bank-feed-statements"
              headers={APIDECK_HEADERS}
              body={
                previewAccount && previewTxn
                  ? {
                      bankFeedStatement: {
                        bank_feed_account_id:
                          bfaIds[previewAccount.id] || "<from step 3>",
                        start_date: previewTxn.transaction_date.slice(0, 10),
                        end_date: previewTxn.posted_at.slice(0, 10),
                        start_balance: 0,
                        start_balance_credit_or_debit: "CREDIT",
                        end_balance: Math.abs(previewAccount.balance),
                        end_balance_credit_or_debit:
                          previewAccount.balance >= 0 ? "CREDIT" : "DEBIT",
                        transactions: [
                          {
                            source_transaction_id: previewTxn.id,
                            posted_date: previewTxn.posted_at.slice(0, 10),
                            description: previewTxn.description,
                            amount: Math.abs(previewTxn.amount),
                            credit_or_debit:
                              previewTxn.amount >= 0 ? "CREDIT" : "DEBIT",
                            counterparty: previewTxn.description,
                            reference: previewTxn.memo,
                            transaction_type:
                              previewTxn.category.toLowerCase(),
                          },
                        ],
                        _note: `One statement per account — ${accounts.length} total. Showing 1 of ${
                          transactionsByAccount[previewAccount.id]?.length || 0
                        } transactions for the first account.`,
                      },
                    }
                  : undefined
              }
              result={statementResult}
              onRun={runCreateStatement}
            />
          </Step>

          <Step
            id="complete"
            title="Step 5 — Done — return to your app"
            state={stepState.complete}
            open={openStep === "complete"}
            onToggle={() =>
              setOpenStep(openStep === "complete" ? ("" as any) : "complete")
            }
            disabled={statementResult.state !== "success"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              The connection is live. From here, on a schedule (or via webhook
              from your bank-feed source) you keep posting fresh statements to
              the same{" "}
              <code className="text-accent-500">bank_feed_account_id</code>.
            </p>
            <button
              type="button"
              onClick={runComplete}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm"
            >
              View live data
            </button>
          </Step>
        </div>
      </div>
    </MacWindow>
  );
}

function Step({
  id,
  title,
  state,
  open,
  disabled,
  onToggle,
  children,
}: {
  id: StepId;
  title: string;
  state: StepState;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl ring-1 ring-white/5 overflow-hidden bg-ink-800/60 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <StateIcon state={state} />
          <span className="text-sm text-zinc-100 truncate">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && !disabled && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 animate-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

function StateIcon({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/40 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-emerald-300" />
      </span>
    );
  if (state === "running")
    return (
      <span className="w-6 h-6 shrink-0 rounded-full bg-accent-500/20 ring-1 ring-accent-500/40 flex items-center justify-center">
        <Loader2 className="w-3.5 h-3.5 text-accent-500 animate-spin" />
      </span>
    );
  return (
    <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
      <CircleDashed className="w-3.5 h-3.5 text-zinc-500" />
    </span>
  );
}
