export type Institution = {
  id: string;
  name: string;
  short?: string;
  // Tailwind bg + text classes for the round logo chip
  logoBg: string;
  logoText: string;
  // Tagline shown on login screen
  tagline?: string;
  // When set, the picker will fetch live branding from this domain via
  // /api/bank-meta and overlay name/logo/color/tagline at render time.
  dynamic?: { domain: string };
  // Optional remote logo (svg/png). Rendered in place of initials when present.
  logoUrl?: string;
  // Optional primary brand color used for hover/ring accents.
  brandColor?: string;
};

export const POPULAR_INSTITUTIONS: Institution[] = [
  {
    id: "chase",
    name: "JP Morgan Chase",
    short: "Chase",
    logoBg: "bg-[#117ACA]",
    logoText: "text-white",
    tagline: "Sign in to chase.com",
  },
  {
    id: "amex",
    name: "American Express",
    short: "Amex",
    logoBg: "bg-[#2E77BC]",
    logoText: "text-white",
    tagline: "Sign in with your American Express ID",
  },
  {
    id: "wells-fargo",
    name: "Wells Fargo Bank",
    short: "Wells Fargo",
    logoBg: "bg-[#D71E28]",
    logoText: "text-[#FFCD41]",
    tagline: "Sign on to wellsfargo.com",
  },
  {
    id: "discover",
    name: "Discover",
    logoBg: "bg-white",
    logoText: "text-[#FF6000]",
    tagline: "Log in to Discover",
  },
  {
    id: "navy-federal",
    name: "Navy Federal Bank",
    short: "Navy Federal",
    logoBg: "bg-[#003366]",
    logoText: "text-[#FFCC00]",
    tagline: "Sign in to Navy Federal",
  },
  {
    id: "us-bank",
    name: "US Bank",
    logoBg: "bg-white",
    logoText: "text-[#1B3A93]",
    tagline: "Login to U.S. Bank",
  },
  {
    id: "usaa",
    name: "USAA Federal Savings..",
    short: "USAA",
    logoBg: "bg-[#003B5C]",
    logoText: "text-white",
    tagline: "Sign in to USAA",
  },
  {
    id: "boa",
    name: "Bank of America",
    logoBg: "bg-white",
    logoText: "text-[#E31837]",
    tagline: "Sign in to Bank of America",
  },
  {
    id: "fidelity",
    name: "Fidelity Investments",
    short: "Fidelity",
    logoBg: "bg-white",
    logoText: "text-[#3A8521]",
    tagline: "Log in to Fidelity",
  },
  {
    id: "citi",
    name: "Citibank",
    logoBg: "bg-white",
    logoText: "text-[#0F4DC2]",
    tagline: "Sign on to Citi",
  },
  {
    id: "capital-one",
    name: "Capital One",
    logoBg: "bg-white",
    logoText: "text-[#004977]",
    tagline: "Sign in to Capital One",
  },
  {
    id: "ally",
    name: "Ally Bank",
    logoBg: "bg-white",
    logoText: "text-[#6B0AB5]",
    tagline: "Sign in to Ally",
  },
];

/**
 * Optional prospect-branded institution sourced from `NEXT_PUBLIC_PROSPECT_DOMAIN`
 * (and optionally `NEXT_PUBLIC_PROSPECT_NAME`). Brand metadata — name, tagline,
 * logo, primary color — is fetched live from the prospect's homepage at render
 * time via /api/bank-meta. Keep this in `.env.local` so it never ships in the
 * public repo.
 */
export function getProspectInstitution(): Institution | null {
  const domain = process.env.NEXT_PUBLIC_PROSPECT_DOMAIN?.trim();
  if (!domain) return null;
  const name = process.env.NEXT_PUBLIC_PROSPECT_NAME?.trim() || domain;
  return {
    id: `prospect-${domain.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    name,
    logoBg: "bg-zinc-700",
    logoText: "text-white",
    tagline: `Sign in to ${name}`,
    dynamic: { domain },
  };
}

/** Helpers: fake initials for logo chip */
export function institutionInitials(i: Institution) {
  const w = i.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[1][0]).toUpperCase();
}
