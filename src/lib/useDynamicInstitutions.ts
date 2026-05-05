"use client";
import { useEffect, useState } from "react";
import { Institution } from "./institutions";

type Meta = {
  domain: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
};

const CACHE_VERSION = 2;
const cache = new Map<string, Meta>();
// Bust per session if version changed
if (typeof window !== "undefined") {
  const key = "__bankMetaCacheVersion";
  // @ts-expect-error window aug
  if (window[key] !== CACHE_VERSION) cache.clear();
  // @ts-expect-error window aug
  window[key] = CACHE_VERSION;
}

/**
 * For any institution with `dynamic.domain`, fetches /api/bank-meta and merges
 * the resulting name, tagline, logo and brand color into the institution.
 * Falls back gracefully to the static defaults on error.
 */
export function useDynamicInstitutions(input: Institution[]) {
  const [list, setList] = useState<Institution[]>(input);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(
    () => new Set(input.filter((i) => i.dynamic).map((i) => i.id))
  );

  useEffect(() => {
    let cancelled = false;
    const dynamics = input.filter((i) => i.dynamic);
    if (dynamics.length === 0) return;

    Promise.all(
      dynamics.map(async (i) => {
        const domain = i.dynamic!.domain;
        if (cache.has(domain)) return { i, meta: cache.get(domain)! };
        try {
          const r = await fetch(
            `/api/bank-meta?domain=${encodeURIComponent(domain)}`
          );
          if (!r.ok) return { i, meta: null };
          const meta = (await r.json()) as Meta;
          cache.set(domain, meta);
          return { i, meta };
        } catch {
          return { i, meta: null };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setList((prev) =>
        prev.map((inst) => {
          const hit = results.find((r) => r.i.id === inst.id);
          if (!hit || !hit.meta) return inst;
          const m = hit.meta;
          return {
            ...inst,
            name: m.name || inst.name,
            tagline: m.tagline || inst.tagline,
            logoUrl: m.logo_url || inst.logoUrl,
            brandColor: m.primary_color || inst.brandColor,
          };
        })
      );
      setLoadingIds(new Set());
    });

    return () => {
      cancelled = true;
    };
  }, [input]);

  return { institutions: list, loadingIds };
}
