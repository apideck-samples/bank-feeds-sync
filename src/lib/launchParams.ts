"use client";
import { useEffect, useState } from "react";

export type LaunchParams = {
  /** Source the user arrived from — `apideck-samples` shows a welcome banner. */
  source: string | null;
  /** Optional accounting service to highlight in the integration walkthrough. */
  service: "xero" | "quickbooks" | "sage" | "freshbooks" | null;
  /** Optional consumer id forwarded into Apideck calls. */
  consumerId: string | null;
  /** Live prospect-brand override — set ?prospect=domain.com to dynamically
   *  prepend that bank to the picker without needing a .env file. */
  prospectDomain: string | null;
  prospectName: string | null;
};

const SERVICES = ["xero", "quickbooks", "sage", "freshbooks"] as const;

function parse(search: string): LaunchParams {
  const p = new URLSearchParams(search);
  const svc = p.get("service");
  return {
    source: p.get("source") ?? p.get("utm_source"),
    service:
      svc && (SERVICES as readonly string[]).includes(svc)
        ? (svc as LaunchParams["service"])
        : null,
    consumerId: p.get("consumer_id") ?? p.get("consumer"),
    prospectDomain: p.get("prospect") ?? p.get("prospect_domain"),
    prospectName: p.get("prospect_name"),
  };
}

const EMPTY: LaunchParams = {
  source: null,
  service: null,
  consumerId: null,
  prospectDomain: null,
  prospectName: null,
};

export function useLaunchParams(): LaunchParams {
  const [params, setParams] = useState<LaunchParams>(EMPTY);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setParams(parse(window.location.search));
  }, []);
  return params;
}
