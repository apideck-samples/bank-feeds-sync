# Apideck Bank Feeds — Interactive Demo

A fully interactive walk-through of the
[Apideck Bank Feeds API](https://developers.apideck.com/guides/bank-feeds-xero)
covering both halves of the product: customer onboarding (link an accounting
platform via Vault) and continuous push (the bank shipping transactions into
QuickBooks / Xero / Sage / FreshBooks).

The demo recreates a Quicken-style "Add all your accounts" experience and
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
    AddAccounts.tsx                # Quicken-style "Add all your accounts"
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
