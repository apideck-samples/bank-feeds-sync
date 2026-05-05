"use client";
// Direct entry point for the integration-progress walkthrough — useful when
// embedding the flow at a stable URL (e.g. as a Vault redirect_uri target).
// The full state machine still lives at /.
import { useMemo } from "react";
import IntegrationProgress from "@/components/IntegrationProgress";
import { POPULAR_INSTITUTIONS } from "@/lib/institutions";
import {
  generateAccountsFor,
  generateTransactionsFor,
  MockTransaction,
} from "@/lib/mockData";

export default function Page() {
  const institution = POPULAR_INSTITUTIONS[0];
  const accounts = useMemo(
    () => generateAccountsFor(institution).filter((a) => a.type !== "loan"),
    [institution]
  );
  const transactionsByAccount = useMemo(() => {
    const out: Record<string, MockTransaction[]> = {};
    for (const a of accounts) out[a.id] = generateTransactionsFor(a, 28);
    return out;
  }, [accounts]);

  return (
    <main className="gradient-bg min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <IntegrationProgress
          institution={institution}
          accounts={accounts}
          transactionsByAccount={transactionsByAccount}
          onFinished={() => {
            window.location.href = "/";
          }}
        />
      </div>
    </main>
  );
}
