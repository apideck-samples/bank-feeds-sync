"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Pause,
  PlayCircle,
  RefreshCw,
  Search,
  Webhook,
  Zap,
} from "lucide-react";
import MacWindow from "./MacWindow";
import {
  ConsumerLink,
  PushEvent,
  generateConsumerLinks,
  generatePushEvent,
  serviceBg,
  serviceLabel,
} from "@/lib/operatorData";
import { formatMoney } from "@/lib/mockData";

const SCHEDULE_LABEL: Record<ConsumerLink["schedule"], string> = {
  realtime: "Real-time (webhook)",
  "15min": "Every 15 min",
  hourly: "Hourly",
  daily: "Daily — 06:00 UTC",
};

export default function OperatorConsole({ onBack }: { onBack: () => void }) {
  const [links] = useState<ConsumerLink[]>(() => generateConsumerLinks(14));
  const [filter, setFilter] = useState("");
  const [events, setEvents] = useState<PushEvent[]>([]);
  const [streaming, setStreaming] = useState(true);
  const counterRef = useRef(0);

  // Live event stream — appends a new push event every 1.4s when streaming.
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => {
      counterRef.current += 1;
      setEvents((prev) => {
        const next = [generatePushEvent(links, counterRef.current), ...prev];
        return next.slice(0, 60);
      });
    }, 1400);
    return () => clearInterval(id);
  }, [streaming, links]);

  // Seed a few rows so the panel isn't empty.
  useEffect(() => {
    const seed: PushEvent[] = [];
    for (let i = 0; i < 6; i++) {
      counterRef.current += 1;
      seed.push(generatePushEvent(links, counterRef.current));
    }
    setEvents(seed);
  }, [links]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return links;
    const q = filter.toLowerCase();
    return links.filter(
      (l) =>
        l.business_name.toLowerCase().includes(q) ||
        l.consumer_id.includes(q) ||
        l.service.includes(q) ||
        l.account_label.toLowerCase().includes(q)
    );
  }, [filter, links]);

  const stats = useMemo(() => {
    const active = links.filter((l) => l.status === "active").length;
    const errors = links.filter((l) => l.status === "error").length;
    const today = events.length;
    const total = links.reduce((n, l) => n + l.total_pushed, 0);
    return { active, errors, today, total };
  }, [links, events.length]);

  return (
    <MacWindow
      title="Apideck Bank Feeds — Operator console"
      footer={
        <>
          <button
            onClick={onBack}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5"
          >
            ← Back to customer view
          </button>
          <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                streaming ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
              }`}
            />
            {streaming ? "Pushing in real-time" : "Stream paused"}
          </span>
          <button
            onClick={() => setStreaming((s) => !s)}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5 inline-flex items-center gap-1.5"
          >
            {streaming ? (
              <>
                <Pause className="w-3 h-3" /> Pause
              </>
            ) : (
              <>
                <PlayCircle className="w-3 h-3" /> Resume
              </>
            )}
          </button>
        </>
      }
    >
      <div className="px-8 py-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ink-700 ring-1 ring-white/10 flex items-center justify-center text-accent-500">
            <Webhook className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-zinc-50">
              Push pipeline — bank operator
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Every transaction landing in your core banking ledger is pushed
              to the customer&apos;s accounting system as a{" "}
              <code className="text-accent-500">bankFeedStatement</code>{" "}
              through Apideck. This console is what your ops team would
              monitor.
            </p>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Stat
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            label="Active links"
            value={stats.active.toString()}
          />
          <Stat
            icon={<AlertTriangle className="w-4 h-4 text-amber-300" />}
            label="Errors (24h)"
            value={stats.errors.toString()}
          />
          <Stat
            icon={<Activity className="w-4 h-4 text-accent-500" />}
            label="Pushed this session"
            value={stats.today.toString()}
          />
          <Stat
            icon={<Zap className="w-4 h-4 text-zinc-200" />}
            label="Lifetime txns"
            value={stats.total.toLocaleString()}
          />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 mt-8">
          {/* Connected SMBs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-100">
                Connected business customers
              </h2>
              <span className="text-[11px] text-zinc-500">
                {filtered.length} of {links.length}
              </span>
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700/70 ring-1 ring-white/10 mb-3">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by business, consumer id, account…"
                className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
              />
            </label>
            <div className="rounded-xl ring-1 ring-white/5 overflow-hidden bg-ink-800/60">
              <div className="grid grid-cols-[1fr_auto_auto] text-[10px] uppercase tracking-wider text-zinc-500 px-4 py-2 border-b border-white/5">
                <span>Customer · account</span>
                <span>Schedule</span>
                <span className="pl-4">Last sync</span>
              </div>
              <div className="max-h-[460px] overflow-y-auto dark-scroll">
                {filtered.map((l) => (
                  <ConsumerRow key={l.consumer_id} link={l} />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center text-xs text-zinc-500 py-8">
                    No matches
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Push event stream */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-100">
                Push event stream
              </h2>
              <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> updates every 1.4s
              </span>
            </div>
            <div className="rounded-xl ring-1 ring-white/5 overflow-hidden bg-ink-800/60">
              <div className="grid grid-cols-[auto_1fr_auto] text-[10px] uppercase tracking-wider text-zinc-500 px-4 py-2 border-b border-white/5 gap-3">
                <span>Status</span>
                <span>Event</span>
                <span>Latency</span>
              </div>
              <div className="max-h-[460px] overflow-y-auto dark-scroll divide-y divide-white/5">
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
                {events.length === 0 && (
                  <div className="text-center text-xs text-zinc-500 py-8">
                    Waiting for events…
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </MacWindow>
  );

  function ConsumerRow({ link }: { link: ConsumerLink }) {
    const minutesAgo = Math.max(
      0,
      Math.round((Date.now() - new Date(link.last_sync_at).getTime()) / 60_000)
    );
    return (
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-white/[0.02] border-b border-white/5 last:border-0">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className={`shrink-0 w-7 h-7 rounded-md ${serviceBg(
              link.service
            )} text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white/10`}
            title={serviceLabel(link.service)}
          >
            {serviceLabel(link.service)
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-100 truncate">
                {link.business_name}
              </span>
              <StatusPill status={link.status} />
            </div>
            <div className="text-[11px] text-zinc-500 truncate">
              {link.account_label} → {serviceLabel(link.service)}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-zinc-400 whitespace-nowrap">
          {SCHEDULE_LABEL[link.schedule]}
        </div>
        <div className="text-[11px] text-zinc-400 whitespace-nowrap pl-4 text-right">
          {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
          <div className="text-[10px] text-zinc-500">
            {link.last_sync_count} txns
          </div>
        </div>
      </div>
    );
  }
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-800/60 ring-1 ring-white/5 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 inline-flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ConsumerLink["status"] }) {
  const map: Record<ConsumerLink["status"], string> = {
    active: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    paused: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    error: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  };
  return (
    <span
      className={`shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${map[status]}`}
    >
      {status}
    </span>
  );
}

function EventRow({ event }: { event: PushEvent }) {
  const since = Math.max(
    0,
    Math.round((Date.now() - new Date(event.ts).getTime()) / 1000)
  );
  const tone =
    event.status === "ok"
      ? "text-emerald-300"
      : event.status === "retry"
        ? "text-amber-300"
        : "text-rose-300";
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-2.5 animate-fade-up">
      <span
        className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 whitespace-nowrap ${
          event.status === "ok"
            ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
            : event.status === "retry"
              ? "bg-amber-500/10 text-amber-300 ring-amber-500/30"
              : "bg-rose-500/10 text-rose-300 ring-rose-500/30"
        }`}
      >
        {event.status === "ok"
          ? "201"
          : event.status === "retry"
            ? "429"
            : "5xx"}
      </span>
      <div className="min-w-0">
        <div className="text-sm text-zinc-100 truncate">
          {event.description}{" "}
          <span
            className={`tabular-nums text-[12px] ${
              event.credit_or_debit === "CREDIT"
                ? "text-emerald-300"
                : "text-rose-300"
            }`}
          >
            {event.credit_or_debit === "CREDIT" ? "+" : "−"}
            {formatMoney(Math.abs(event.amount))}
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 truncate">
          {event.consumer} · {event.account_label} → {serviceLabel(event.service)}{" "}
          · {since === 0 ? "now" : `${since}s ago`}
        </div>
      </div>
      <span className={`text-[11px] tabular-nums ${tone} whitespace-nowrap`}>
        {event.latency_ms}ms
      </span>
    </div>
  );
}
