# Global E-Wallet — Product and Rebuild Blueprint

Status: implementation blueprint
Source system: BlueCrest Premium Banking
Target product: Global E-Wallet

## 1. Product abstraction

Global E-Wallet is a mobile-first, multi-currency wallet for holding money, sending and receiving funds, converting currencies, funding a wallet, withdrawing to an external destination, and tracking every movement in one clear activity feed.

It is not a renamed bank portal. The product should feel fast, personal, borderless, and payment-focused. Banking concepts that do not serve that purpose should not be carried into the new application.

### Core promise

> Hold, send, receive, and convert money across borders from one simple wallet.

### Primary users

- Individuals receiving or sending money locally and internationally.
- Freelancers and remote workers holding more than one currency.
- Travelers who need clear balances and conversion.
- Small sellers who receive money through a wallet handle, QR code, or payment link.
- Operations staff who review KYC, deposits, withdrawals, disputes, and risk events.

### Product principles

1. The wallet balance and next action must be obvious within seconds.
2. Every movement of money must create immutable ledger records.
3. Displayed balances are derived from or reconciled with the ledger.
4. Currency is attached to every wallet, quote, transfer, and ledger entry.
5. Money is stored in integer minor units, never floating-point values.
6. Sensitive payment credentials are never stored directly by this application.
7. Risk, limits, fees, and exchange rates are disclosed before confirmation.
8. Pending, completed, failed, reversed, and cancelled are distinct states.

## 2. What exists in BlueCrest

The current repository is a React 19/Vite frontend with a Node.js HTTP API and SQLite/PostgreSQL database adapters.

### Existing customer capabilities

- Registration, password login, login code, logout, password reset, and email verification.
- Profile management, preferred language/currency, KYC submission, and account status.
- Checking and savings balance presentation.
- Internal and external transfers with PIN and optional verification-code flow.
- Transaction history and transfer receipts.
- Deposit requests and withdrawal destinations/requests.
- Debit-card application and payment-reference upload.
- Loan application and disbursement workflow.
- Joint accounts and owner invitations.
- Notifications, customer support chat, and push subscription.
- Market snapshot, stocks display, account summary, and security settings.

### Existing operations capabilities

- User, transfer, deposit, loan, card, KYC, and transaction administration.
- Manual and batch ledger entries.
- Account restriction and transfer status controls.
- Transfer verification-code management and attempt history.
- Customer notifications, support inbox, and email configuration/logging.
- Activity logs, statistics, sandbox balance adjustment, and reconciliation.

### Existing technical strengths to preserve

- Authentication middleware and role separation.
- Service/repository separation in most backend domains.
- SQLite-first local development with PostgreSQL production support.
- Transaction/ledger services with tests for idempotent completion.
- Tests covering invalid PINs, insufficient balance, internal transfer double-entry behavior, loan disbursement, withdrawal completion, joint ownership, email normalization, and login codes.
- A central API response format and a small frontend API helper.

### Existing constraints not to copy into the wallet

- `App.tsx` owns navigation, session state, balance polling, transfer orchestration, formatting, and modal state in one component.
- Navigation uses local tab state instead of URL routes.
- API access is split between direct `fetch` calls and the shared helper.
- The client stores profile and balance mirrors in `localStorage` and polls several endpoints every eight seconds.
- Monetary database columns use `REAL`; wallet amounts must use integer minor units or exact decimals.
- Bank account identity is mixed into the user record (`account_number`, checking/savings balances).
- Some card fields include card number/CVV concepts that must be delegated to a PCI-compliant processor and tokenized.
- The backend uses a hand-built sequential HTTP route dispatcher; the wallet should use a conventional router and request validation.
- Domain types are incomplete and API payloads rely heavily on `any`.
- Bank-specific transfer controls and manually issued verification codes should become a general risk/challenge system.
- The `WithdrawalPage` exists but is not mounted in the main `App.tsx` navigation.

## 3. Keep, transform, remove, add

| BlueCrest capability | Global E-Wallet decision | Target form |
|---|---|---|
| Authentication and sessions | Keep, harden | Access/refresh session model, device list, revoke session |
| Email verification | Keep | Verification plus resend/rate limiting |
| Profile | Keep, simplify | Personal details, wallet handle, locale, security |
| KYC | Keep, redesign | Tiered verification and transaction limits |
| Checking/savings accounts | Replace | One wallet per currency |
| Account number/branch code | Replace | Public wallet handle plus internal wallet ID |
| Internal transfer | Keep, rename | Send to Global E-Wallet user/contact |
| External bank transfer | Keep behind adapter | Withdraw to bank account |
| Deposit requests | Replace | Add money through provider-backed funding intents |
| Bitcoin deposit instructions | Optional later | Crypto funding adapter, isolated from fiat ledger |
| Withdrawal destinations | Keep, redesign | Saved payout methods with masked details |
| Transaction history | Keep | Unified activity feed with filters and receipts |
| Transfer PIN | Keep concept | Transaction PIN/passkey challenge |
| Transfer verification codes | Generalize | Risk challenges (OTP, passkey, step-up review) |
| Notifications | Keep | In-app, email, optional push preferences |
| Support | Keep | Support threads, attachment support, disputes |
| Admin panel | Keep, rebuild | Operations console with least-privilege roles |
| Activity/audit log | Keep | Immutable audit events with actor and correlation ID |
| Joint accounts | Remove from v1 | Consider shared wallets as a later product |
| Loans | Remove | Separate lending product, not wallet core |
| Stocks/trading | Remove | Separate investment product |
| Bank account summary | Remove | Replace with wallet insights/activity |
| Debit-card application | Remove from v1 | Add virtual/physical card only via issuer processor later |
| Market/Bitcoin dashboard tile | Transform | Currency rates and conversion quote only |
| Sandbox admin control | Keep only in non-production | Provider simulator and test-wallet controls |

## 4. Version-one experience

### Customer navigation

1. **Home** — total estimated value, currency wallets, quick actions, latest activity.
2. **Wallets** — USD/EUR/GBP/etc. balances, wallet details, statements.
3. **Send** — recipient, source wallet, amount, quote/fee, review, authorize, receipt.
4. **Add money** — supported funding methods, amount, provider handoff, status.
5. **Convert** — source/target currencies, live quote, fee, expiry, confirmation.
6. **Activity** — unified searchable/filterable ledger activity and receipts.
7. **Profile** — personal details, verification tier, limits, payout methods.
8. **Security** — transaction PIN/passkey, devices, sessions, password, 2FA.
9. **Help** — support conversations and transaction disputes.

Desktop may use a compact sidebar. Mobile should use bottom navigation for Home, Wallets, Send, Activity, and Profile. “Add money” and “Convert” can be prominent actions rather than permanent tabs.

### Home screen hierarchy

- Greeting, avatar, notification indicator.
- “Total wallet value” with show/hide control and base-currency selector.
- Horizontally scrollable currency-wallet cards.
- Four actions: Send, Add money, Convert, Withdraw.
- Recent activity with status, amount, currency, counterparty, and time.
- Verification/limit prompt only when relevant.
- Exchange-rate strip; no stock or loan promotion.

### Key happy paths

#### Send to another wallet user

1. Choose recipient from contacts or enter `@handle`, email, phone, or QR.
2. Resolve recipient without exposing private profile details.
3. Choose source currency wallet.
4. Enter amount and optional note.
5. Show fee, recipient amount, exchange rate if applicable, and total debit.
6. Confirm with transaction PIN/passkey or a step-up challenge.
7. Post balanced ledger entries atomically.
8. Show shareable receipt and notify both parties.

#### Add money

1. Choose wallet and funding method.
2. Create a funding intent with an idempotency key.
3. Redirect to or embed the payment provider.
4. Treat the browser result as informational only.
5. Credit the wallet only after a verified provider webhook.
6. Update activity and notify the user.

#### Convert currency

1. Choose source and destination wallets.
2. Request a time-limited quote containing rate, fee, and expiry.
3. Confirm before expiry.
4. Debit source and credit destination atomically using the locked quote.
5. Store both legs, the quote, effective rate, and fee in the ledger.

#### Withdraw

1. Choose wallet and a verified payout destination.
2. Validate balance, limits, destination, fee, and risk.
3. Reserve funds while payout is pending.
4. Complete or release the reservation from signed provider webhooks.
5. Allow retry/reversal without double-debiting.

## 5. Brand and visual direction

The new vibe should be clearly unrelated to BlueCrest’s corporate blue bank aesthetic.

### Proposed direction: “Aurora Money”

- Personality: optimistic, global, energetic, precise.
- Base: near-black ink `#101114` and warm cloud `#F7F6F2`.
- Primary: electric violet `#6C4DFF`.
- Accent: bright mint `#38E8B0`.
- Supporting accent: coral `#FF7A68`.
- Typography: a warm geometric display face paired with a highly legible UI sans.
- Surfaces: softly tinted cards, crisp borders, large numeric typography, restrained glow.
- Motion: quick balance transitions, directional transfer motion, subtle success pulse.
- Imagery: abstract routes, currency paths, and map-grid motifs—not shields, bank buildings, or credit-card hero art.

Use “Global E-Wallet” as the working product name. Before public launch, run trademark, domain, and app-store-name checks.

### Copy vocabulary

| Avoid | Use |
|---|---|
| Bank account | Wallet |
| Account holder | Wallet owner |
| Account number | Wallet handle / wallet ID |
| Deposit | Add money |
| Fund transfer | Send money |
| Beneficiary | Recipient/contact |
| Wire transfer | Bank withdrawal |
| Account statement | Wallet statement |
| Branch code | Remove |
| Checking/savings | Currency wallet |

## 6. Target architecture

Use a modular monorepo so the customer app, operations console, API, background worker, and shared contracts evolve together without becoming one giant application.

```text
global-e-wallet/
├─ apps/
│  ├─ web/                  # Customer React application
│  ├─ ops/                  # Operations/admin React application
│  ├─ api/                  # HTTP API
│  └─ worker/               # Webhooks, notifications, reconciliation jobs
├─ packages/
│  ├─ contracts/            # API schemas and generated TypeScript types
│  ├─ database/             # Schema, migrations, repositories
│  ├─ ledger/               # Double-entry posting and invariants
│  ├─ money/                # Minor units, currencies, rounding, formatting
│  ├─ auth/                 # Session and authorization primitives
│  ├─ providers/            # Funding, payout, FX, KYC adapters
│  ├─ ui/                   # Shared design system
│  └─ config/               # TypeScript/lint/build configuration
├─ docs/
│  ├─ architecture/
│  ├─ api/
│  ├─ runbooks/
│  └─ threat-model/
└─ infra/                   # Deployment definitions and environment templates
```

### Frontend boundaries

```text
src/
├─ app/                     # Router, providers, global error handling
├─ features/
│  ├─ auth/
│  ├─ onboarding/
│  ├─ wallets/
│  ├─ recipients/
│  ├─ transfers/
│  ├─ funding/
│  ├─ payouts/
│  ├─ exchange/
│  ├─ activity/
│  ├─ verification/
│  ├─ security/
│  ├─ notifications/
│  └─ support/
├─ components/              # Product-neutral shared components
├─ lib/                     # API client, query cache, formatting
└─ styles/                  # Tokens and global styles
```

Each feature owns its screens, components, queries, mutations, types, and tests. The app shell should only compose routes and providers.

### Backend modules

- Identity: users, profiles, handles, sessions, devices, credentials.
- Compliance: KYC cases, verification tiers, limits, sanctions/provider results.
- Wallets: currency wallets, wallet status, available and reserved balance views.
- Ledger: accounts, journal entries, postings, references, reconciliation.
- Recipients: wallet contacts and tokenized/masked payout methods.
- Transfers: peer-to-peer and cross-currency sends.
- Funding: funding intents and provider webhooks.
- Payouts: withdrawal intents, reservations, provider execution, reversal.
- Exchange: rate providers, quotes, conversion execution.
- Risk: rules, challenges, velocity limits, holds, review queue.
- Notifications: event templates, preferences, delivery attempts.
- Support/disputes: conversations, cases, evidence, resolution.
- Operations: dashboards, reviews, adjustments, audit access.

Use a transactional outbox for post-commit work. Ledger posting and the outbox event must commit in the same database transaction; workers then deliver notifications and provider jobs safely.

## 7. Canonical data model

### Identity and access

- `users`: id, public_id, email, phone, handle, status, locale, base_currency, timestamps.
- `user_profiles`: user_id, legal name, date of birth, country, address, avatar reference.
- `credentials`: user_id, password hash metadata, transaction-PIN hash metadata, passkeys.
- `sessions`: hashed refresh token, user_id, device_id, expiry, revoked_at.
- `devices`: user_id, label, platform, last_seen_at, trust status.
- `verification_cases`: user_id, tier, provider reference, status, decision reason.
- `limit_profiles`: verification tier and per-action/day/month limits.

### Wallet and ledger

- `wallets`: id, user_id, currency, status, created_at; unique `(user_id, currency)`.
- `ledger_accounts`: id, owner type/id, currency, purpose, normal side.
- `journal_entries`: id, public reference, event type, status, idempotency key, occurred_at.
- `postings`: journal_entry_id, ledger_account_id, direction, amount_minor.
- `balance_snapshots`: ledger_account_id, posted_minor, reserved_minor, version.
- `holds`: wallet_id, reason, amount_minor, status, expires_at, journal reference.

Every journal entry must balance independently per currency. Never update a wallet balance without a journal entry. Cached balance snapshots must be updated in the same database transaction as postings.

### Money movement

- `recipients`: owner_user_id, type, display name, wallet user reference or payout-method reference.
- `transfers`: sender wallet, recipient wallet, amount, fee, status, note, risk decision.
- `funding_intents`: wallet, provider, amount, status, idempotency key, provider reference.
- `payout_methods`: user, type, provider token, masked details, verification status.
- `payouts`: wallet, payout method, amount, fee, hold, status, provider reference.
- `fx_quotes`: source/destination currencies and amounts, rate, fee, provider, expiry.
- `conversions`: source wallet, destination wallet, quote, status, journal reference.
- `provider_events`: provider, external event id, signature result, payload reference, processed_at.

### Engagement and operations

- `notifications`, `notification_preferences`, `delivery_attempts`.
- `support_threads`, `support_messages`, `disputes`, `dispute_events`.
- `risk_events`, `auth_challenges`, `review_cases`.
- `audit_events`: actor, action, target, before/after references, IP, correlation ID, timestamp.
- `outbox_events`: topic, aggregate, payload, attempts, available_at, processed_at.

### Money representation

```ts
type Money = {
  amountMinor: string; // serialized integer, safe across JSON boundaries
  currency: string;    // ISO 4217 code
};
```

Currency metadata defines the exponent. For example, USD 10.25 is `1025`; currencies with zero or three decimal places are handled through their own exponent. Formatting belongs at the presentation boundary.

## 8. Version-one API surface

All mutating endpoints accept `Idempotency-Key`. Responses use a stable envelope, typed error codes, and a request/correlation ID.

### Authentication and identity

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/challenges/verify`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `PATCH /v1/me`
- `GET /v1/me/sessions`
- `DELETE /v1/me/sessions/:sessionId`
- `POST /v1/verification/cases`
- `GET /v1/verification/status`

### Wallets and activity

- `GET /v1/wallets`
- `POST /v1/wallets`
- `GET /v1/wallets/:walletId`
- `GET /v1/wallets/:walletId/activity`
- `GET /v1/activity`
- `GET /v1/activity/:activityId`
- `GET /v1/activity/:activityId/receipt`

### Recipients and transfers

- `GET /v1/recipients`
- `POST /v1/recipients/resolve`
- `POST /v1/transfers/quotes`
- `POST /v1/transfers`
- `GET /v1/transfers/:transferId`
- `POST /v1/transfers/:transferId/challenges/verify`
- `POST /v1/payment-links`
- `GET /v1/payment-links/:slug`
- `POST /v1/payment-links/:slug/pay`

### Funding, conversion, and payout

- `GET /v1/funding-methods`
- `POST /v1/funding-intents`
- `GET /v1/funding-intents/:intentId`
- `POST /v1/fx/quotes`
- `POST /v1/conversions`
- `GET /v1/payout-methods`
- `POST /v1/payout-methods`
- `POST /v1/payouts/quotes`
- `POST /v1/payouts`
- `GET /v1/payouts/:payoutId`
- `POST /v1/webhooks/:provider` (signed provider requests only)

### Notifications and support

- `GET /v1/notifications`
- `PATCH /v1/notifications/:id/read`
- `PATCH /v1/notification-preferences`
- `GET /v1/support/threads`
- `POST /v1/support/threads`
- `POST /v1/support/threads/:id/messages`
- `POST /v1/disputes`

### Operations

- `GET /v1/ops/users`
- `GET /v1/ops/transactions`
- `GET /v1/ops/reviews`
- `POST /v1/ops/reviews/:id/decisions`
- `POST /v1/ops/wallet-adjustments` (dual approval above threshold)
- `GET /v1/ops/reconciliation-runs`
- `GET /v1/ops/audit-events`

## 9. State machines

### Transfer

```text
DRAFT → QUOTED → AWAITING_AUTHORIZATION → PROCESSING → COMPLETED
                           │                  ├──────→ FAILED
                           └──────→ CANCELLED └──────→ REVERSED
```

### Funding intent

```text
CREATED → REQUIRES_ACTION → PROCESSING → SUCCEEDED
                │               ├──────→ FAILED
                └──────→ EXPIRED└──────→ REVERSED
```

### Payout

```text
CREATED → FUNDS_HELD → SUBMITTED → PAID
             │             ├────→ FAILED → FUNDS_RELEASED
             └────→ CANCELLED → FUNDS_RELEASED
```

Status transitions belong in domain services and are conditional/idempotent. Controllers and webhooks must not directly modify balances.

## 10. Security and compliance baseline

- Hash passwords and transaction PINs with a memory-hard password hashing algorithm and separate parameters.
- Store refresh tokens as hashes; rotate them and detect reuse.
- Prefer secure, HTTP-only, same-site cookies for browser refresh sessions.
- Require CSRF protection when cookie authentication is used.
- Apply schema validation, request-size limits, rate limits, and brute-force protection.
- Encrypt sensitive personal information at rest and keep encryption keys outside the database.
- Store uploaded KYC documents in private object storage with short-lived signed access.
- Do not log passwords, PINs, tokens, full identity documents, or raw provider payload secrets.
- Use processor tokens for cards/bank instruments. Never store CVV.
- Verify webhook signatures against the raw request body and deduplicate provider event IDs.
- Add maker/checker approval for high-risk manual adjustments.
- Keep append-only audit events for all operations actions.
- Run sanctions/PEP and transaction-monitoring workflows through configurable provider adapters as required by launch jurisdictions.
- Define retention, deletion, incident-response, reconciliation, and customer-complaint runbooks before production launch.

Regulatory requirements depend on where the wallet is offered and where funds are held. Product launch must use licensed payment/custody partners and jurisdiction-specific legal/compliance review; software completion alone does not authorize holding customer funds.

## 11. Reuse map from this repository

### Reuse after refactoring

- Authentication flows and normalization behavior.
- KYC form concepts and status display.
- Transfer review/PIN/success interaction patterns.
- Notification list and unread behavior.
- Support customer/admin conversation model.
- Database provider abstraction for early development.
- Ledger, reconciliation, and idempotency test ideas.
- Admin workflow concepts and audit/activity logging.
- Locale and currency formatting utilities.

### Rewrite rather than copy

- `src/App.tsx`: split into URL router, session provider, query cache, and feature routes.
- `src/types.ts`: replace with shared schema-generated contracts.
- Direct `fetch` usage: route all calls through a typed API client.
- Balance polling: use query invalidation after mutations; add server events only where valuable.
- `users.balance` and `accounts.balance`: replace with currency wallets backed by ledger accounts.
- `transfers`: redesign around wallet IDs, quotes, fees, idempotency, risk, and journal references.
- Deposit/withdrawal request workflows: redesign around asynchronous provider intents and signed webhooks.
- Admin panel: make a separate operations application with granular permissions.
- Route dispatcher: move to a framework router with middleware and validation.

### Do not port to v1

- Loans and loan fees.
- Stocks/trading UI.
- Checking/savings labels and branch codes.
- Joint accounts.
- Debit-card application and direct card credential columns.
- Static Bitcoin funding instructions.
- Production sandbox balance controls.
- Corporate shield branding and BlueCrest color system.

## 12. Delivery plan

### Phase 0 — decisions and safeguards

- Choose launch countries, supported currencies, custody/payment partners, KYC provider, payout rails, and FX source.
- Write architecture decisions for money representation, ledger invariants, idempotency, session storage, provider boundaries, and webhook processing.
- Produce threat model and compliance/data-flow map.
- Create the monorepo, CI checks, environment validation, secret policy, and migration tooling.

Exit: decisions are documented; skeleton apps build; no money movement exists yet.

### Phase 1 — identity and wallet foundation

- Implement registration, verification, login, refresh/logout, profile, devices, and KYC status.
- Implement currency metadata, wallet creation, ledger accounts, journal posting, snapshots, and reconciliation.
- Build the new design system, responsive shell, onboarding, Home, Wallets, and empty Activity screens.
- Add unit/property tests proving every journal balances and duplicate idempotency keys do not double-post.

Exit: verified test users can sign in and own empty currency wallets; reconciliation passes.

### Phase 2 — peer-to-peer payments

- Implement wallet handles, recipient resolution, contacts, same-currency transfers, transaction PIN/passkey challenge, receipts, and notifications.
- Implement fees/limits/risk decisions as explicit records.
- Build Send and Activity experiences and the operations transaction viewer.

Exit: two users can send test funds atomically, retries are safe, and both see matching activity.

### Phase 3 — funding and withdrawals

- Add provider interfaces, funding intents, payout methods, holds, payouts, webhook inbox, and retry/dead-letter handling.
- Build Add Money and Withdraw flows.
- Add daily automated provider-versus-ledger reconciliation and exception queue.

Exit: sandbox provider flows survive duplicated, delayed, and out-of-order webhooks without balance corruption.

### Phase 4 — multi-currency conversion

- Add rate-provider adapter, quote expiry, markup/fee disclosure, conversion journal templates, and rate fallback rules.
- Build Convert UI and cross-currency send quoting.

Exit: conversions reconcile per currency and cannot execute against stale quotes.

### Phase 5 — operational readiness

- Complete operations roles, KYC/risk queues, adjustment approval, disputes, support, notification preferences, audit search, and runbooks.
- Perform load, penetration, recovery, dependency-failure, and reconciliation tests.
- Add observability for API latency, provider errors, ledger imbalance, webhook backlog, reconciliation differences, and suspicious velocity.

Exit: launch checklist, partner certification, operational training, and jurisdiction approvals are complete.

### Later, only after wallet core is stable

- QR merchant payments and richer payment links.
- Virtual/physical cards through an issuing provider.
- Shared/family wallets with explicit permissions.
- Crypto wallets through a separately modeled custody integration.
- Business wallets, invoicing, and batch payouts.

Loans and investments should remain separate products with separate regulatory and risk designs.

## 13. Test strategy and release gates

### Ledger invariants

- Sum of postings equals zero for every journal entry and currency.
- No negative available balance unless a wallet product explicitly permits it.
- Completed transfer retries never post twice.
- Failed/cancelled payouts release exactly the original hold once.
- Reversal links to the original entry and is itself balanced.
- Cached balance equals the sum of posted ledger movements.

### Required automated coverage

- Money arithmetic and currency exponents.
- Authentication, session rotation/revocation, authorization, and rate limiting.
- KYC tier and transaction-limit enforcement.
- Every valid and invalid status transition.
- Duplicate API calls and duplicate/out-of-order provider webhooks.
- Provider timeouts before and after provider-side success.
- Concurrent sends competing for the same available balance.
- Cross-currency rounding, expired quotes, fees, and reversals.
- Operations permissions, dual approval, and audit creation.
- Accessibility and responsive customer journeys.

### Release gates

- Type checking, linting, unit, integration, contract, and end-to-end tests pass.
- Database migrations are forward-tested and restore procedure is exercised.
- Reconciliation reports zero unexplained differences.
- No critical/high security findings remain open.
- Provider webhook replay and outage drills pass.
- Monitoring, alert ownership, support, and incident runbooks are active.

## 14. First implementation slice

Build a vertical slice before expanding the feature count:

1. New Global E-Wallet visual shell and responsive Home screen.
2. Register/login/session flow.
3. USD wallet creation.
4. Admin-only test funding through a non-production provider simulator.
5. Same-currency send by wallet handle.
6. Double-entry ledger posting and unified Activity feed.
7. Transaction PIN challenge, receipt, notification, and reconciliation test.

This slice touches the full architecture and proves the hardest invariant—safe money movement—without the distraction of loans, cards, investments, or multiple payment providers.

## 15. Definition of v1 done

Global E-Wallet v1 is done when a verified customer can securely create supported currency wallets, add money through an approved provider, send another wallet user, convert supported currencies, withdraw to a verified destination, inspect or export activity, manage security, and reach support; operations staff can review risk/KYC events, reconcile all provider and ledger movements, resolve exceptions, and audit every privileged action.

The interface must contain no BlueCrest name, banking navigation, bank-account terminology, loan/trading surface, or copied corporate-blue visual identity.
