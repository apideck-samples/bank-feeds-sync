import { POPULAR_INSTITUTIONS } from "./institutions";

export type AccountingService = "xero" | "quickbooks" | "sage" | "freshbooks";

export type ConsumerLink = {
  consumer_id: string;
  business_name: string;
  service: AccountingService;
  bank_feed_account_id: string;
  source_account_id: string;
  account_label: string;
  status: "active" | "paused" | "error";
  last_sync_at: string;
  last_sync_count: number;
  total_pushed: number;
  schedule: "realtime" | "15min" | "hourly" | "daily";
};

const SERVICE_LABEL: Record<AccountingService, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks Online",
  sage: "Sage",
  freshbooks: "FreshBooks",
};

const SERVICE_BG: Record<AccountingService, string> = {
  xero: "bg-[#13B5EA]",
  quickbooks: "bg-[#2CA01C]",
  sage: "bg-[#00DC00]",
  freshbooks: "bg-[#0075DD]",
};

export function serviceLabel(s: AccountingService) {
  return SERVICE_LABEL[s];
}
export function serviceBg(s: AccountingService) {
  return SERVICE_BG[s];
}

const BUSINESSES = [
  "Acme Industries LLC",
  "Bluefin Coffee Roasters",
  "Cobblestone Architects",
  "Driftwood Studio",
  "Evergreen Landscape Co",
  "Fika Bakery",
  "Harbor Marine Supply",
  "Ironclad Welding",
  "Juniper & Sage Design",
  "Kettle Hill Brewing",
  "Lumen Lighting Co",
  "Meridian Consulting",
  "Northbound Outfitters",
  "Oak & Anchor Pub",
  "Polaris Robotics",
  "Quill & Press",
  "Rivermark Pediatrics",
  "Stonebridge Realty",
  "Tideline Surf School",
  "Umbra Optical",
];

export function generateConsumerLinks(count = 14): ConsumerLink[] {
  const services: AccountingService[] = [
    "xero",
    "quickbooks",
    "sage",
    "freshbooks",
  ];
  const schedules: ConsumerLink["schedule"][] = [
    "realtime",
    "15min",
    "hourly",
    "daily",
  ];
  const out: ConsumerLink[] = [];
  const seed = 1337;
  const rnd = (n: number) => {
    const x = Math.sin(seed + n * 9301) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < count; i++) {
    const business = BUSINESSES[i % BUSINESSES.length];
    const service = services[i % services.length];
    const schedule = schedules[Math.floor(rnd(i) * schedules.length)];
    const lastSyncMin = Math.floor(rnd(i + 11) * 240);
    const status: ConsumerLink["status"] =
      rnd(i + 99) < 0.07 ? "error" : rnd(i + 7) < 0.05 ? "paused" : "active";
    const inst = POPULAR_INSTITUTIONS[i % POPULAR_INSTITUTIONS.length];
    out.push({
      consumer_id: `consumer_${i.toString(36)}_${business
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .slice(0, 6)}`,
      business_name: business,
      service,
      bank_feed_account_id: `bfa_${Math.floor(rnd(i + 1) * 1e10).toString(36)}`,
      source_account_id: `${inst.id}-${i % 4 === 0 ? "chk" : "sav"}`,
      account_label: `${inst.short || inst.name} ${
        i % 4 === 0 ? "Checking" : "Savings"
      } ••${(2000 + i * 17) % 9000}`,
      status,
      last_sync_at: new Date(Date.now() - lastSyncMin * 60_000).toISOString(),
      last_sync_count: status === "error" ? 0 : 4 + Math.floor(rnd(i + 22) * 22),
      total_pushed:
        12_000 + Math.floor(rnd(i + 3) * 240_000) + i * (i + 1) * 17,
      schedule,
    });
  }
  return out;
}

export type PushEvent = {
  id: string;
  ts: string;
  consumer: string;
  service: AccountingService;
  account_label: string;
  description: string;
  amount: number;
  credit_or_debit: "CREDIT" | "DEBIT";
  status: "ok" | "retry" | "error";
  latency_ms: number;
};

const EVENT_DESCRIPTIONS: Array<{
  d: string;
  c: "CREDIT" | "DEBIT";
  min: number;
  max: number;
}> = [
  { d: "Stripe Payout — sp_1Pd...", c: "CREDIT", min: 480, max: 4800 },
  { d: "ACH credit — Customer wire", c: "CREDIT", min: 2400, max: 28000 },
  { d: "Card purchase — AWS", c: "DEBIT", min: 80, max: 1200 },
  { d: "Card purchase — Vercel", c: "DEBIT", min: 20, max: 280 },
  { d: "Wire out — Payroll ADP", c: "DEBIT", min: 4200, max: 28000 },
  { d: "ACH debit — Linear", c: "DEBIT", min: 8, max: 120 },
  { d: "Card purchase — Slack", c: "DEBIT", min: 12, max: 180 },
  { d: "Refund — Delta Air Lines", c: "CREDIT", min: 60, max: 880 },
  { d: "Card purchase — Whole Foods", c: "DEBIT", min: 18, max: 220 },
  { d: "Interest paid", c: "CREDIT", min: 4, max: 80 },
];

export function generatePushEvent(links: ConsumerLink[], n: number): PushEvent {
  const link = links[n % links.length];
  const e = EVENT_DESCRIPTIONS[n % EVENT_DESCRIPTIONS.length];
  const seed = (n + 1) * 9301;
  const rnd = (k: number) => {
    const x = Math.sin(seed + k * 1117) * 10000;
    return x - Math.floor(x);
  };
  const amount =
    Math.round((e.min + (e.max - e.min) * rnd(2)) * 100) / 100;
  const status: PushEvent["status"] =
    rnd(3) < 0.04 ? "error" : rnd(4) < 0.06 ? "retry" : "ok";
  return {
    id: `evt_${Math.floor(rnd(5) * 1e10).toString(36)}`,
    ts: new Date().toISOString(),
    consumer: link.business_name,
    service: link.service,
    account_label: link.account_label,
    description: e.d,
    amount,
    credit_or_debit: e.c,
    status,
    latency_ms:
      status === "ok"
        ? 110 + Math.floor(rnd(6) * 290)
        : 800 + Math.floor(rnd(7) * 4200),
  };
}
