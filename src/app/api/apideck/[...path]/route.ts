import { NextRequest, NextResponse } from "next/server";

// Mock of the real Apideck Bank Feeds API (Xero) — request/response shapes
// mirror https://developers.apideck.com/guides/bank-feeds-xero so the demo
// teaches the actual integration. Every route returns realistic data with
// a small artificial latency.
//
// Endpoints implemented:
//   POST /accounting/bank-feed-accounts
//   POST /accounting/bank-feed-statements
//   POST /vault/sessions                 (create a Vault session for linking)
//   GET  /vault/connections/{service_id} (verify connection state)

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

const delay = (min = 350, max = 900) =>
  new Promise<void>((r) =>
    setTimeout(r, Math.floor(min + Math.random() * (max - min)))
  );

function requireHeaders(req: NextRequest) {
  const missing: string[] = [];
  for (const h of ["x-apideck-app-id", "x-apideck-consumer-id"]) {
    if (!req.headers.get(h)) missing.push(h);
  }
  return missing;
}

function ok(
  body: Record<string, unknown>,
  status = 200,
  meta: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      status_code: status,
      status: status >= 200 && status < 300 ? "OK" : "Error",
      service: "xero",
      ...meta,
      ...body,
    },
    { status }
  );
}

async function handle(method: string, route: string, req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  await delay();

  // Vault — create session for linking
  if (method === "POST" && route === "vault/sessions") {
    return ok(
      {
        resource: "Sessions",
        operation: "vaultSessionsCreate",
        data: {
          session_uri: `https://vault.apideck.com/session/${uid("vs")}`,
          expires_in: 1800,
        },
      },
      201
    );
  }

  // Vault — verify connection
  if (method === "GET" && route.startsWith("vault/connections/")) {
    const service_id = route.split("/")[2];
    return ok(
      {
        resource: "Connection",
        operation: "vaultConnectionsOne",
        data: {
          id: `connection_${service_id}_${uid("c").slice(0, 8)}`,
          service_id,
          unified_api: "accounting",
          state: "callable",
          integration_state: "callable",
          updated_at: new Date().toISOString(),
        },
      },
      200
    );
  }

  // Bank Feed Accounts — create
  if (method === "POST" && route === "accounting/bank-feed-accounts") {
    const a = body?.bankFeedAccount ?? body ?? {};
    return ok(
      {
        resource: "BankFeedAccounts",
        operation: "bankFeedAccountsAdd",
        data: {
          id: uid("bfa"),
          source_account_id: a.source_account_id,
          target_account_id: a.target_account_id ?? null,
          target_account_name: a.target_account_name ?? null,
          target_account_number: a.target_account_number ?? null,
          bank_account_type: a.bank_account_type ?? "bank",
          currency: a.currency ?? "USD",
          status: "active",
          created_at: new Date().toISOString(),
        },
      },
      201
    );
  }

  // Bank Feed Statements — create
  if (method === "POST" && route === "accounting/bank-feed-statements") {
    const s = body?.bankFeedStatement ?? body ?? {};
    const tx = (s.transactions ?? []) as Array<unknown>;
    return ok(
      {
        resource: "BankFeedStatements",
        operation: "bankFeedStatementsAdd",
        data: {
          id: uid("bfs"),
          bank_feed_account_id: s.bank_feed_account_id,
          start_date: s.start_date,
          end_date: s.end_date,
          start_balance: s.start_balance,
          start_balance_credit_or_debit: s.start_balance_credit_or_debit,
          end_balance: s.end_balance,
          end_balance_credit_or_debit: s.end_balance_credit_or_debit,
          transactions_accepted: tx.length,
          transactions_rejected: 0,
          received_at: new Date().toISOString(),
        },
      },
      201
    );
  }

  return NextResponse.json(
    {
      status_code: 404,
      status: "Not Found",
      detail: `Unknown route: ${method} /${route}`,
    },
    { status: 404 }
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const missing = requireHeaders(req);
  if (missing.length)
    return NextResponse.json(
      { status_code: 401, status: "Unauthorized", missing_headers: missing },
      { status: 401 }
    );
  return handle("GET", path.join("/"), req);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const missing = requireHeaders(req);
  if (missing.length)
    return NextResponse.json(
      { status_code: 401, status: "Unauthorized", missing_headers: missing },
      { status: 401 }
    );
  return handle("POST", path.join("/"), req);
}
