"use client";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import MacWindow from "./MacWindow";
import InstitutionLogo from "./InstitutionLogo";
import { Institution } from "@/lib/institutions";
import { firstSentence } from "@/lib/text";

export default function LoginScreen({
  institution,
  onSuccess,
  onCancel,
}: {
  institution: Institution;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1200));
    onSuccess();
  };

  return (
    <MacWindow
      title={`Connect — ${institution.short || institution.name}`}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5"
          >
            Cancel
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-500/70" />
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            <span className="w-2 h-2 rounded-full bg-white/15" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <Lock className="w-3 h-3" /> 256-bit encrypted via Apideck Bank
            Feeds
          </div>
        </>
      }
    >
      <div className="px-10 py-12 max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <InstitutionLogo institution={institution} size={56} />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">
              {institution.name}
            </h1>
            <p className="text-sm text-zinc-400">
              {institution.tagline ? firstSentence(institution.tagline) : null}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 animate-fade-up">
          <div>
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Username
            </label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={u}
              onChange={(e) => setU(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-lg bg-ink-700/70 ring-1 ring-white/10 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-accent-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-lg bg-ink-700/70 ring-1 ring-white/10 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-accent-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !u || !p}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? "Authenticating…" : "Sign in securely"}
          </button>

          <p className="text-[11px] text-zinc-500 text-center pt-2">
            By signing in you authorize Apideck to retrieve account and
            transaction data on your behalf. Credentials are not stored.
          </p>
        </form>
      </div>
    </MacWindow>
  );
}
