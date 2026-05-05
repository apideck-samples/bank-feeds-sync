# Apideck Bank Feeds Sync — Interactive Demo

A fully interactive walk-through of the
[Apideck Bank Feeds API](https://developers.apideck.com/guides/bank-feeds-xero)
covering both halves of the product: customer onboarding (link an accounting
platform via Vault) and continuous push (the bank shipping transactions into
QuickBooks / Xero / Sage / FreshBooks).

The demo presents a desktop-style "Add all your accounts" experience and
walks the user end-to-end through:

1. Searching 14,000+ supported institutions
2. Signing in to a chosen bank
3. Picking which accounts to share
4. Running each Apideck Bank Feeds API call with live request/response panels
5. Viewing the transactions that just synced through

Every API call hits a live Next.js mock route (`/api/bank-feeds/*`) so the
experience feels real without needing credentials.

## Run it

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:3000>.

### Optional: prospect-branded institution

For sales demos you can prepend a prospect's bank to the picker — the demo
fetches their real name, logo, primary brand color and tagline live from their
homepage. Copy `.env.local.example` to `.env.local` and set:

```
NEXT_PUBLIC_PROSPECT_DOMAIN=examplebank.com
NEXT_PUBLIC_PROSPECT_NAME=Example Bank
```

`.env.local` is gitignored so prospect names stay local.

### Launch from the Apideck samples page

The demo can be linked or embedded from
<https://www.apideck.com/samples/bank-feeds>. Supported query params:

| Param | Effect |
|---|---|
| `?source=apideck-samples` | Shows a "welcome from Apideck samples" banner |
| `?service=xero\|quickbooks\|sage\|freshbooks` | Sets the target accounting service in the integration walkthrough (headers, copy, redirect text) |
| `?consumer_id=…` | Forwarded as `x-apideck-consumer-id` in the displayed API calls |
| `?prospect=domain.com&prospect_name=…` | Prepends a prospect-branded institution to the picker (overrides the env var) |

The demo also serves a permissive `frame-ancestors` CSP so it can be
embedded in an iframe from `apideck.com`.

## Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- lucide-react

## Structure

```
src/
  app/
    page.tsx                       # state machine for the 5 stages
    api/bank-feeds/[...path]/      # mock Apideck Bank Feeds API
  components/
    AddAccounts.tsx                # institution picker ("Add all your accounts")
    LoginScreen.tsx                # bank login simulation
    AccountSelector.tsx            # pick which accounts to link
    IntegrationProgress.tsx        # collapsible API-call walkthrough
    Dashboard.tsx                  # live transactions view
    MacWindow.tsx                  # macOS window chrome
    MockApiCall.tsx                # request/response panel
    InstitutionLogo.tsx
  lib/
    institutions.ts                # popular FIs
    mockData.ts                    # account + transaction generators
```
