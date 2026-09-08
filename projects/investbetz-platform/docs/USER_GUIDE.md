# BetPool Platform — User Guide

**Version:** 2.1  
**Last Updated:** September 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started — Registration & Login](#2-getting-started--registration--login)
3. [Home — The Betting Feed](#3-home--the-betting-feed)
4. [Wallet — Deposits & Withdrawals](#4-wallet--deposits--withdrawals)
5. [My Bets — Stake Tracking & Cashout](#5-my-bets--stake-tracking--cashout)
6. [Match Pools — Parimutuel Betting](#6-match-pools--parimutuel-betting)
7. [Bet Manager — AI-Managed Portfolios](#7-bet-manager--ai-managed-portfolios)
8. [Social Profiles & Sharing](#8-social-profiles--sharing)
9. [Leaderboard — Tipsters & Creators](#9-leaderboard--tipsters--creators)
10. [Creator Economy — Badges & Commission](#10-creator-economy--badges--commission)
11. [Profile — Account Management](#11-profile--account-management)
12. [Notifications](#12-notifications)
13. [Legal Pages](#13-legal-pages)
14. [Key Concepts & Terminology](#14-key-concepts--terminology)
15. [Configuration & Environment Flags](#15-configuration--environment-flags)
16. [Troubleshooting & FAQ](#16-troubleshooting--faq)

---

## 1. Overview

BetPool is a sports betting and AI-managed investment platform with a social, premium betting layer. Users can:

- **Place single and accumulator (parlay) bets** on curated Pods — expert/ Ora-selected markets with stake-back guarantees.
- **Copy booking codes in one tap** (`Copy & Stake`, default ₦500) — every code shows how many times it was copied and who created it.
- **Social interaction** — like codes (like counts are hydrated across feeds), inline comment previews (3) + a global comments sheet, double-tap-to-like with heart burst on the For You feed.
- **Follow creators & share profiles** — public profiles at `/social/:id`, premium cover cards, track records, verified badges, and a viral share sheet (WhatsApp / Telegram / X / Facebook / Instagram / TikTok / copy link / native share) with attributed links (`?src=share&ref=profile&via=`).
- **Climb Tipster Tiers** — Rising / Pro / Legend badges earned from settled copy volume + follower win-rate/ROI. Leaderboard ranks active creators.
- **Earn creator commission** — badge tier determines a nightly payout (10% / 15% / 20% of the platform win-fee, wins-only, ₦100 threshold).
- **Bet on Match Pools** — parimutuel pools where winners share the pool proportionally.
- **Invest in Bet Manager** — deposit into AI-managed tiers (Academy through Chairman, 6 tiers) where Ora daily allocates capital; history now shows both deposits and transparent pool bets.
- **Deposit/Withdraw** via Paystack (bank transfer, card, USSD).
- **Cash out** active bets early (manual + auto-cashout with live-price scaling).
- **Chat with Ora AI** for support.

### Device Support

Separate premium layouts for desktop and mobile. `/home` has a feed-first mobile Option B (slim hero ~120px, sticky controls at 54px), a centered feed, and an accordion “More from Ora”. The For You feed is a TikTok-style full-screen overlay (`z-index: 850`, below nav) with its own topbar.

---

## 2. Getting Started — Registration & Login

### 2.1 Landing Page (`/`)

Public marketing page. Hero “Your Money is Safe at BetPool”, How It Works (3 steps), Testimonials, Stats, FAQ, Footer (Terms/Privacy/Cookies). CTA: “Create Your Free Account” → `/auth/signup`, “Sign In” → `/auth/login`.

### 2.2 Sign Up (`/auth/signup`)

| Step | Field | Details |
|------|-------|---------|
| 1 | Full Name | Legal name |
| 1 | Phone Number | Nigerian mobile (+234 auto-prefixed) |
| 1 | Email (optional) | For email notifications |
| 1 | Agree to Terms | Checkbox required |
| 2 | OTP Verification | 6-digit code via SMS (+ email if provided) |
| 3 | Set PIN | 6-digit numeric PIN (withdrawals + PIN login) |

Auto-login → redirect to `/home`.

### 2.3 Login (`/auth/login`)

| Method | How it works |
|--------|-------------|
| **PIN** | Phone + 6-digit PIN — fastest |
| **Email Token** | Email → 6-digit code → verify |
| **OTP** | Phone → SMS OTP → verify |

Redirects to intended page or `/home`. Guest users can view any `/social/:id` profile without logging in; follow/copy actions gate to login with `?returnUrl=/social/:id`.

### 2.4 Password/PIN Reset

- **Forgot PIN:** OTP → verify → set new PIN.
- **Change PIN (logged in):** Profile → Security → Change PIN.

---

## 3. Home — The Betting Feed

**Route:** `/home`

### 3.1 Top Navigation Bar

Logo, Wallet Balance + “Top Up”, Active Bets count, Notification Bell (unread badge), Nav Links (Home / Match Pools / Bet Manager / My Bets / Wallet / Profile / Leaderboard), Logout. Brand-balanced palette (emerald, navy, glass).

### 3.2 Mobile Option B — Feed-First Layout (`home-mobile`)

- **Slim hero** (~120px): greeting, balance, Active + win-rate — not a full-screen billboard.
- **Sticky controls** (`top: 54px`): sport filters + search, single sticky layer.
- **Feed first** (`feed-area` before `more-ora`): pods/code posts are the first content after controls.
- **More from Ora accordion** (`moreExpanded`): featured / Ora Picks / quick-play / upcoming / insights / games-teaser / live ticker collapsed behind “More from Ora”.
- **Create Code** labelled (not just “+”).

### 3.3 For You — Immersive Full-Screen Feed (`swipe-deck`)

Activated on the “For You” tab. Fixed overlay `inset: 0; z-index: 850` (below nav 1001 / slip 1000 / sheet 1400), `height: viewportH` driven by `visualViewport` + `visualViewport` listeners, `overflow: hidden` on body while immersive, `measure()` removed.

| Layer | Content |
|-------|---------|
| **Topbar** | Tabs, live count, search (when `searching`, progress bar fades), Create button, thin progress (`top: 74px` / search `76px` / card `126px` offsets that account for `safe-area + 20px`) |
| **Backdrop/Scrim** | Dark `rgba(3,7,18,0.72)` overlay; removed `backdrop-filter: blur(3px)` that caused flicker |
| **Hero** | Centered match/selection copy |
| **Right rail** | Like, Comment, Share, Copy — vertical stack |
| **Bottom caption** | Creator, PICK/odds/conf, pool, proof, CTA |
| **Other** | Swipe-hint (“Swipe up”), `heart-burst` overlay, like-count pill (`socialFeed.likeCount(pod)`) |

Immersive is gated off in For You when not needed; scroll/swipe is vertical snap.

### 3.4 Ora Prediction Callout

Glass callout (eyebrow “Ora prediction” + pick/confidence) shown on both decks:

- **Mobile:** rendered inside swipe-deck, hides when confidence is 0%.
- **Desktop:** `@if (isOra())` guard — only Ora-curated pods show the callout (after title). Scoped SCSS, twins social `code-post-card` styling.

### 3.5 Pod Cards & Code Post Cards

**Pod cards:** match vs, league, selection, odds, min/max stake, exposure bar, countdown (`timeRemaining` mutated in-place to avoid 1s `pods.update(map spread)` churn that previously caused comment flicker), refund %, why-recommended.

**Code post cards:** author, booking code, legs, odds, `Copies` count (batched hydration on 3 feeds), `Copy & Stake` button (see 3.8), `CreatorBadge` (settled tier), like/comment counts.

Swipe-deck parity: `refundPercent`, `whyRecommended` block with `deck-ora-badge` (AI Curator).

### 3.6 Double-Tap-to-Like

Available only inside the immersive card (ignores `button/a/input/[role=tab]`). `DOUBLE_TAP_MS: 320ms`, `PX: 48px`. Logic:

- `heart` signal + `heartSeq` for keyed `.heart-burst` animation.
- `handleTap(e)` / `doubleTapLike()` / `onCardDblClick()` — ensures a double-tap never unlikes (always `liked = true`), single tap is ignored for like.

Desktop also shows a like-count pill beside the comment pill for parity with mobile.

### 3.7 Comments — Inline Preview + Global Sheet

System twins `code-post-card` comment patterns:

| Surface | Behaviour |
|---------|-----------|
| **Inline (`pod-comments`)** | Up to 3 comments visible directly under `<mat-card-content>` (no extra card, `border-top` + `padding-top: 10px` + `gap: 8px`, `12px 16px 16px` → `14px 20px` ≥480px), placeholder “Add a comment…”, optimistic post, `loadedPodId` guard prevents reload flicker, twins exposure-bar removal |
| **Global sheet (`comments-sheet`)** | Slide-up sheet with count header, context card, ESC/backdrop/body-lock, full thread; invoked by “View all” (inline) or directly from swipe-deck |
| **Placement** | `<app-comments-sheet/>` hosted once in `home-desktop.html` + `home-mobile.html`; `social-feed.service.ts` owns `commentsSheet` + `open/closeCommentsSheet()` |

Previous flicker roots fixed: in-place `isOpen/timeRemaining` mutation, `now.set` without `pods.update` spread, removed `cdr.detectChanges()`, darkened non-blurred overlay.

### 3.8 Copy & Stake (W2)

One-tap follower action on any code post:

- Button label “Copy & Stake” (amount = `HomeStore.slipStakeAmount`, default **₦500**, user-editable via slip).
- Action: redeem booking-code → `POST /stakes` with `creatorId` + `idempotencyKey` (per-action `COM_…`) → auto-follow creator (“Following — Undo” toast).
- **Attribution (W1):** `Stake.creatorId` sparse (`{creatorId, status, settledAt}` index). `resolveBookingCode → {code, creatorId}`; self-copy writes `creatorId: null`. Backfilled via `api/src/scripts/backfill-stake-creator.ts` (recent run: 33 → 25 attributable / 8 self / 0 orphaned). `GET /stakes` join now includes `creatorId`.
- **Copy counts (W2):** `attachCopyCounts` batches `Stake` counts per code on `podFeed`, `personalized`, `social` feeds; `CodePost.copies` shown in card + detail.
- **Idempotency (dedup):** end-to-end `idempotencyKey` wired: `bet-slip` (`slipKey` per slip, `emitGuard` + watchers) → `home-mobile/desktop` `placingBet` guard → `stake.controller → stake.service` dedup; `ora-chat` per-action `data.idempotencyKey`. Duplicate rapid taps / time-out retries do **not** create a second stake.
- Guest users tapping Copy & Stake are redirected to login with return URL.

### 3.9 Stake Modal (Single) & Accumulator Bet Slip

Single: amount (min/max, quick-selects), potential payout `stake × odds`, platform fee 35% of profit, net payout, confirm → `POST /stakes`.

Accumulator: “+” on up to `MAX_ACCUMULATOR_LEGS` (default 5) Pods → combined multiplier, one stake for all legs, `PlaceAccumulator` via `stake.service.ts:353 POST /stakes`. Post-commit `notifyStakePlaced` is fire-and-forget (fixed `201` delay from SMTP `notification.service.ts:243-264`), client shows success immediately.

One-leg insurance: `ACCUMULATOR_INSURANCE_MIN_LEGS` (default 4) — if exactly one leg fails and rest win, pays reduced accumulator on winners (10% fee on reduced payout); voided legs excluded, `insuranceApplied: true` + “Insured” chip.

### 3.10 Search

Top search, debounced 300ms, filters team/league/sport. `searching` state fades progress bar.

### 3.11 Wallet Top-Up (from Home)

“Top Up” → modal → preset (5K/10K/20K/50K/100K/500K/custom) → `POST /wallet/deposit` → Paystack redirect → callback verifies → wallet refresh.

---

## 4. Wallet — Deposits & Withdrawals

**Route:** `/wallet` (+ `/wallet/withdraw`)

### 4.1 Wallet Dashboard

Available Balance, Total Balance (available + locked), Total Deposited, Total Withdrawn, Total Staked, Total Winnings.

### 4.2 Deposit

Select amount (5K/10K/20K/50K/100K/500K/custom) → `POST /wallet/deposit` → Paystack (card/bank/USSD) → auto-redirect → callback verifies. Limits 5,000–1,000,000 per txn.

### 4.3 Withdraw (`/wallet/withdraw`)

Amount (min 500, max 5M, daily 10M), bank picker (50+ Nigerian banks), 10-digit account → name auto-resolves, 4-digit withdrawal PIN, optional save. `POST /wallet/withdraw`. Fee 1.5% capped ₦50. Saved accounts with default, `WITHDRAWAL_RECONCILIATION` every 5 min reconciles stuck withdrawals.

### 4.4 Transaction History

Tabbed + filter chips: **All / Deposits / Withdrawals / Commission**. New txn type `commission` (handshake `#E8B923`, gold) for creator payouts; `WalletService.getTransactionIcon/Color` + `isCredit` + wallet store filter. Row shows date, type, description, amount (+/−), status. Also paginated on mobile.

### 4.5 Performance Fees

- Pods: 35% of net profit.
- Match Pools: 15% of pool (parimutuel).
- Bet Manager: 20% of net pool profit (see 7).
- Auto-cashout: 10% of stake.

---

## 5. My Bets — Stake Tracking & Cashout

**Route:** `/bets`

### 5.1 Summary Cards

Active / Won / Refunded / Void.

### 5.2 Active Bets Tab

Match, selection, odds, stake, potential payout, **Cashout** (10% fee) via `GET …/cashout/quote → POST …/cashout/confirm`, **Auto-Cashout** (see 5.3). Arb odds enrichment: live sport-odds lookup per selection (888Sport→TopSport pairing) to refine cashout fairness.

Polling every 30s.

### 5.3 Auto-Cashout (all active bets)

- Arm: “Auto-Cashout” → target ₦100 → live-quote max. Badge “Armed — pays out at ₦X”. `GET /stakes/:id/auto-cashout`, `POST /stakes/:id/auto-cashout` (arm), `DELETE` (disarm).
- Scheduler (`AUTO_CASHOUT_SCHEDULER`, `AUTO_CASHOUT_TICK_MS` 30s default, `AUTO_CASHOUT_MAX_PER_TICK` 50) executes when live quote `≥` target.
- **Stage-1 quote:** 90% of stake baseline; each won leg locks in multiplier (`90% × stake × ∏won`); 2+ lost → 0; 1 lost → floored at one-leg insurance payout.
- **Stage-2 liveliness:** while any leg is in-play, scaled by `AUTO_CASHOUT_LIVE_FACTOR` (default 0.75); status from `MATCH_STATUS_WATCHER` cache (`AUTO_CASHOUT_STATUS_TTL_MS` 60s); failures fall back to Stage-1.
- **Caps:** `AUTO_CASHOUT_MAX_PER_USER` (5) and `AUTO_CASHOUT_MAX_GLOBAL` (200).
- Records `AUTO_CASHOUT_` txn (`metadata.autoTriggered: true`) + “Auto-cashout” settlement note.
- **Near-start guard:** `AUTO_CASHOUT_NEAR_START_HOURS` (3h) gates liveliness scaling window.

### 5.4 History Tab

Paginated; date, selection + outcome, odds, stake, potential payout, status (Won/Refunded/Cashed Out/Void/Cancelled), result (profit green). Parlays: leg count + per-leg status, `insuranceApplied` → “Insured” chip.

---

## 6. Match Pools — Parimutuel Betting

**Route:** `/match-pools`

### 6.1 How Match Pools Work

> Parimutuel — winners share the pool (minus **15% platform fee**) proportionally within the winning market. Losing stakes are **not** refunded. Distinct from Pods (fixed odds + stake-back).

### 6.2 Pool List

Stats: Total Pools, Open Pools, Combined Pool (NGN), My Stakes. Cards with staking-close countdown.

### 6.3 Pool Card (Expanded)

Title (e.g., “Match Day 5 — Goals Markets”), markets: label, total staked, % of pool, rank icon (1st/2nd/trailing).

### 6.4 Placing a Pool Stake

Tap market → amount (per-pool min/max) → confirm → `POST /match-pools/:poolId/stakes`.

### 6.5 My Stakes Tab

Table: event, market, stake, potential payout, status (Open/Won/Lost/Settled), date.

---

## 7. Bet Manager — AI-Managed Portfolios

**Route:** `/bet-manager` + `/bet-manager/deposit/:tier` + `/bet-manager/:tier`

### 7.1 Concept

> Mutual-fund-style. Deposit into a risk tier → pooled cash + units at current NAV → Ora daily allocates across live Pods and Match Pools → returns grow NAV → 20% performance fee on net profit only. 30-day lock per deposit.

### 7.2 Six Tiers

| Tier | Min Deposit | Strategy | Allocation | Color |
|------|-------------|----------|------------|-------|
| 🧑‍🎓 Academy | 10,000 NGN | Starter — lowest entry | Low-tier Pods | Slate |
| 🧤 Goalkeeper | 20,000 NGN | Very conservative | 1.2–1.5x Pods | Blue |
| 🛡️ Defender | 50,000 NGN | Conservative — high refund confidence | 1.2–1.8x Pods | Green |
| ⚡ Midfielder | 100,000 NGN | Balanced — Pods + Match Pools | 1.5–2.5x Pods + Pools | Yellow |
| 🎯 Striker | 200,000 NGN | Aggressive — more pools | 2–5x Pods + more Pools | Red |
| 👔 Chairman | 500,000 NGN | Highest risk/return | Highest multipliers | Gold |

Admins see Pool Cash (`Pool Cash`, `Total Units`, `Current NAV`) per tier on the overview.

### 7.3 Overview (`/bet-manager`)

3×2 tier grid (cards show min, strategy, fee/lock). If active: Portfolio Value, Total Deposited, Profit/Loss, **View Details / Deposit More / Withdraw All**. Toggleable 4-step “How it works” guide. System wallets are auto-healed per tier (`ensureSystemWallets`, `backfill-pool-wallet-users.ts`).

### 7.4 Deposit into a Tier (`/bet-manager/deposit/:tier`)

Select tier → quick amounts (1×/2×/5× min or custom) → review (30-day lock, 20% fee) → `POST /bet-manager/deposit` → units at current NAV. `BM_SCHEDULER` lifecycle every 2h: unlock → reconcile → allocate → settle.

### 7.5 Tier Detail (`/bet-manager/:tier`)

| Section | Content |
|---------|---------|
| **Hero** | Portfolio value, current NAV, total deposited, P&L, locked vs unlockable |
| **NAV History** | Per-cycle bars (start/end NAV, return %) |
| **Performance** | Current value, return %, cycle breakdown table (`getPerformance`) |
| **History** | **Two tabs** — **Deposits** and **Bets** (see 7.6) |
| **Actions** | Withdraw (only when unlockable > 0, confirms at current NAV, zeros units) |

### 7.6 History — Deposits & Bets (Transparent)

Detail page now has a segmented tab:

- **Deposits** — your own `BetManagerDeposit` history (`GET /bet-manager/:tier/deposits`): type (deposit/withdrawal), amount, units, NAV at execution, date, status (locked/unlocked/withdrawn), plus filters (type/status/date range/search), sorting, pagination.
- **Bets** — **pool-level** transparent bet history (`GET /bet-manager/:tier/bets`): every stake the pool placed (visible to any authenticated user, not just participants). `BetManagerService.getBetHistory` (tier, status/date/sort/pagination) joins `Stake → Pod` for richer columns (date, market/selection, odds, stake, potential payout, status chips `chip-running/won/lost/void`, result). Also filterable/sortable/paginated. Desktop = table, Mobile = stacked rows.

**Empty & prospect states:**

- No bets yet: “No bets yet — the allocation engine will place pool bets once funded.”
- Not yet participating but tier has pool history: **Deposit CTA banner** (“The {{tier}} pool is active — deposit to participate and share in every live bet we place”) shown above the bets table, so prospects see live activity before depositing.
- Trades/wallet checks green (`tsc` + `ng build`), Karma 218+ passing with `BetHistoryRecord/Page` specs.

### 7.7 Withdrawal

Only deposits older than 30 days (unlocked). Withdraws **all** unlocked value at current NAV, zeros the tier account; re-deposit anytime. Confirmation modal guards.

---

## 8. Social Profiles & Sharing

**Route:** `/social/:id` — **public** (no auth guard). Backend registers `router.use('/social', socialRoutes)` **before** `requireAuth` (`routes/index.ts:63`), with 5 public `GET /social/public/*` endpoints using `optionalAuth` (returns `isFollowing/isSelf = false` for guests). Authenticated fetch falls back to the public endpoints, so incognito always renders. Follow/Copy actions remain gated (redirect to login with return URL).

### 8.1 Premium Cover Card (mobile + desktop)

Same premium design on both breakpoints, no HTML change — glass/blur `1.5rem` card, radial emerald→blue banner `132px` (mobile) / `148px` (desktop), dual blurred orbs + top sheen + bottom scrim, avatar `84px/96px` with `4px #0e1524` border + halo + inner highlight, Ora gradient variant, name `1.32–1.45rem/800/-0.02em` with shadow, verified + `ora-badge` (now side-by-side via `.w2f-name-row` to avoid 140px truncation) + `creator-badge` (`#rank`), username `0.8rem` muted, role chips (creator rank), **action row** (Follow/Following — `person_add/check`, 42px tall; Share profile — glass pill with blur), **guest CTA** (see 8.2) with `14px 0 0` clearance (fixed overlap), **stats row** (4 glass tiles: Codes/Followers/Following/Likes, `1rem` radius, hover lift). Verified `tsc` + `ng build`.

### 8.2 Guest CTA & Share Sheet

**Guest CTA** (visible only when logged out, i.e., `isGuest`): “Join BetPool to follow Alex Imenwo and copy their slips in one tap — See verified badges, track records and live codes — then log in to act.” Button → `/auth/login?returnUrl=/social/:id`. Spaced `14px` (mobile) / `16px` (desktop) below action row, `position: relative; z-index: 1; clear: both; width: 100%` — no overlap with top button.

**Share sheet** (`share-sheet/*`): premium grid modal opened by “Share profile”. Channels:

- **WhatsApp** (`wa.me` intent), **Telegram**, **X**, **Facebook**, **Instagram** (copy), **TikTok** (copy) — copy variants still copy the attributed link and toast.
- **Copy link**
- **Native Share** (Web Share API when available)

Profile context forwarded as `{ id, name, username, isOra, badge, tipsterBadge }`. Share link is **attributed**: `?src=share&ref=profile&via=<profileId>` (propagated wherever links are copied/shared). Toasts confirm actions; guest can share without logging in.

### 8.3 Profile Tabs

| Tab | Content |
|-----|---------|
| **Codes** | Paginated `code-post-card` list (`X/Y` counts), “Load more” (when `codesHasMore`), empty state “has not shared any booking codes yet.” Guest cta + Copy & Stake gating applies. |
| **Followers / Following** | User rows (avatar, name, verified, “You” chip, handle, Follow/Following mini button for non-self/non-Ora). Hidden entirely for Ora profiles. |
| **Track record** | Settled-only badge provenance: if `tier !== Rookie`, shows settled count, winRate %, follower ROI %; else “No settled track record yet — badges need 20+ settled copies.” Backed by `TipsterBadge`. |
| **Achievements** | Horizontal badge scroll with locked/unlocked states, color-coded rings. |

Navigation: header back → `/home`, user rows → `/social/:id`.

---

## 9. Leaderboard — Tipsters & Creators

**Route:** `/leaderboard` (Tipsters tab) — also visible from Home “Top creators” strip.

The Tipsters board ranks **active creators by follower ROI**:

- **Metrics per row:** ROI %, Win Rate %, Settled copies, badge chip (`Rising/Pro/Legend`), avatar/name.
- **Sort:** ROI descending (rate-based, not lifetime volume).
- **Filters:** Period tabs — **Week / Month / All** (settledAt window), respects `minSettled`.
- **Eligibility:** `minSettled` default **20** (passed as `?minSettled=20`); creators with fewer settled copies are hidden. Self excluded from row? No, self is excluded from board calculation on backend only where appropriate (pool commissions self-copy is `creatorId: null`), but board includes self if above threshold.
- **Data source:** `GET /leaderboard/tipsters?period=&minSettled=&limit=` via `tipster-leaderboard.service.ts` (settledAt window + rate + exclusion of orphaned/self). Rows show `tipsterBadge` and link to `/social/:id` + “Copy & Stake”/follow on touch.
- **Specs:** 9 specs passing; platform Karma green.

---

## 10. Creator Economy — Badges & Commission

**Additive, behind kill-switches, nightly batch, bounded jobs, frontend guards for missing fields.**

### 10.1 Tipster Badges (W3)

Model `TipsterBadge` (one row per user with ≥1 creation): tier, score, follower stats.

| Tier | Floors (settled copies) | Commission Rate |
|------|-------------------------|-----------------|
| **Rookie** | 0 | 0% (prospective only, no payout) |
| **Rising** | 20 | 10% of win-fee |
| **Pro** | 100 | 15% |
| **Legend** | 500 | 20% |

- Computed nightly by `tipsterBadgeScheduler` (every 24h) from **settled** stakes only; uses `Stake.creatorId + status=won/lost + settledAt`, winRate/ROI on follower outcomes.
- `TIPSTER_BADGES=enabled` in `server.ts:73` — set to `disabled` to freeze (keeps last values).
- Commission rate mapping is **locked 10/15/20**; any ENV/config change does not alter paid tiers.
- Frontend: `CreatorBadgeComponent` on `code-post-card`, who-to-follow rows, both social-profile pages, tipster board rows.

### 10.2 Creator Copy Commission (W4)

- **When:** nightly `commissionScheduler` (every 24h, after badge recompute), `CREATOR_COMMISSION=enabled` (`server.ts:78`). Disabled → ledger rows still accrue as `pending`, no transfers.
- **What:** only **won** settled stakes with an attributable `creatorId` and a non-Rookie badge at settlement time. The creator earns `tierRate × platform win-fee` on that stake (not on stake amount, not on losses). Single atomic txn per pending batch.
- **Threshold:** `CREATOR_MIN_PAYOUT` (default **₦100**) — pending rows must sum to ≥ ₦100 before a creator is actually paid (credited to wallet as a `commission` txn). Below threshold stays `pending`.
- **Ledger:** `CreatorCommission` (pending → paid on win, voided on stake expiry, unique `COM_` ref). New txn type `commission` (handshake gold) appears in Wallet history/filters (see 4.4).
- **Prospective only:** no retroactive badge upgrades for already-settled stakes; backfilled stakes are marked self/or-attributable but commissions accrue only after schedulers start.
- **Safety:** kill-switches + bounded batch sizes, `hasPendingCommission` flag, `tsc` green, Karma covered.

---

## 11. Profile — Account Management

**Route:** `/profile`

### 11.1 Personal Info

Full Name (editable), Email (editable), Phone (read-only).

### 11.2 Security

Change PIN (`POST /auth/pin/change`), Phone verification (OTP), KYC (3 steps: phone → BVN/NIN 11-digit → address; `POST /auth/kyc`). KYC required for higher withdrawal limits.

### 11.3 Referrals

Unique referral code + Web Share / copy, bonus stats, rules. New referrals credit on first deposit (configurable).

### 11.4 Support

Ora AI Chat (quick chips: “What’s my balance?”, “How do I place a bet?”, “Deposit help”, “KYC help”, or free-form), FAQ (5), `support@betpool.tech`.

---

## 12. Notifications

**Route:** `/notifications`

All/Unread tabs, type-icon color, title/message/time-ago, Mark Read/Unread (dot), Delete, Mark All Read, pagination. Types: Deposit (green), Withdrawal (red), Stake (blue), Payout (green), Referral (purple), KYC (yellow), Auth (grey), System (orange), Marketing (from `ORA_PICKS_PUSH` daily pick).

---

## 13. Legal Pages

| Route | Content |
|-------|---------|
| `/terms` | Eligibility 18+, accounts, deposits/withdrawals, pods/stakes, cashout, referrals, liability |
| `/privacy` | Data collection/usage/sharing/security/cookies/user rights |
| `/cookies` | Cookie types/why/controls |

---

## 14. Key Concepts & Terminology

| Term | Definition |
|------|------------|
| **Pod** | Curated market with fixed odds + stake-back guarantee. Ora AI + expert curation. |
| **Booking Code** | Leg bundle code; copy-and-stake resolves to the concrete legs. Shows copy count. |
| **Stake** | Amount wagered on a Pod or Match Pool market. |
| **Creator / Tipster** | User whose booking code is copied; identified via `Stake.creatorId`. Self-copies are `null`. |
| **Copies** | Number of stakes that resolved a given booking code ( `CodePost.copies` ). |
| **Accumulator (Parlay)** | Up to 5 combined selections (one stake). One-leg insurance when 4+ legs. |
| **Cashout / Auto-Cashout** | Early settlement; auto-cashout arms a target and executes via 30s scheduler. |
| **Stake-Back Guarantee** | If Pod loses, refund % shown on card. |
| **Match Pool** | Parimutuel — winners share pool minus 15% fee. Losers not refunded. |
| **Bet Manager** | 6-tier AI portfolio (Academy/Goalkeeper/Defender/Midfielder/Striker/Chairman); NAV per unit; 20% perf fee; 30-day lock; pool-level bet history now transparent. |
| **NAV** | Net Asset Value — (Pool Cash + Active Allocations) / Total Units. |
| **Tipster Badge** | Rookie/Rising/Pro/Legend — settled-copy-based creator tier (20/100/500 floors). |
| **ROI / Win Rate** | Follower-centric metrics powering the Tipsters board and badges. |
| **Commission** | Creator payout on won copies: 10/15/20% of realized win-fee, gated by `CREATOR_MIN_PAYOUT`. Wallet `commission` txn. |
| **Performance Fee** | 20% of Bet Manager net pool profit. |
| **Platform Fee** | 35% of Pod net profit, 15% of Match Pool. |

---

## 15. Configuration & Environment Flags

Source: `api/.env.example` + `api/src/server.ts`. All flags are optional; defaults shown.

| Flag | Default | Purpose |
|------|---------|---------|
| `ORA_AUTOMATION` | `enabled` | 2h curation + publishing cycle, pod caps (`MAX_ACTIVE_PODS` 300) |
| `RISK_AUTO_ESCALATION` | `enabled` | 15m risk scheduler (`RISK_*` thresholds) |
| `MATCH_STATUS_WATCHER` | `enabled` | 3m live status watcher (feeds auto-cashout liveliness) |
| `DAILY_DIGEST` / `DAILY_DIGEST_HOUR` | `enabled`/8 | Daily AI Briefing |
| `ORA_PICKS_PUSH` | `enabled` | Daily pick-of-the-day in-app push |
| `T4_ADVISORY` | `enabled` | 6h health advisory |
| `WITHDRAWAL_RECONCILIATION` | `enabled` | 5m stuck-withdrawal sweep |
| `TIPSTER_BADGES` | `enabled` | Nightly settled-data badge recompute — `disabled` freezes |
| `CREATOR_COMMISSION` | `enabled` | Nightly settled-wins-only payout — `disabled` keeps `pending` |
| `CREATOR_MIN_PAYOUT` | `100` | Accrued commission threshold before transfer |
| `AUTO_CASHOUT_SCHEDULER` | `enabled` | 30s armed-stake evaluator (`TICK_MS` / `LIVE_FACTOR` / `NEAR_START_HOURS` / `STATUS_TTL_MS` / caps) |
| `VIRTUAL_GAMES_ENABLED` | `enabled` | Instant games |
| `LOYALTY_ENABLED` / `CASHBACK_*` / `COACHING_ENABLED` | `enabled` | Loyalty tiers + 2% cashback on 3-loss streak (credited real NGN) + bankroll nudges |
| `BM_SCHEDULER` | `enabled` | Bet Manager lifecycle (2h) — pool wallet bootstrap + unlock/reconcile/allocate/settle |
| `POD_DEFAULT_*` / `MAX_ACCUMULATOR_LEGS` / `ACCUMULATOR_INSURANCE_MIN_LEGS` | 100/100000/500000 / 5 / 4 | Staking defaults & parlay rules |

**Developer note:** API runs on `:8383` (`api/.env:2 PORT`, `environment.ts:3`), not `:8080` (often occupied by WAMP). CORS `http://localhost:4200`. Background schedulers shown in `api/src/server.ts:20-98`.

---

## 16. Troubleshooting & FAQ

### Login

**Forgot PIN.** OTP login → Profile → Security → Change PIN.  
**No OTP.** Check SMS/spam; resend after 60s.

### Deposit

**Not showing.** Wallet checks pending on load. If stuck, contact Ora chat / `support@betpool.tech`. Ensure Paystack callback reached `/api/wallet/callback`.

### Withdrawal

Reasons blocked: daily limit (10M), insufficient available, unverified KYC, wrong PIN. `WITHDRAWAL_RECONCILIATION` retries; typically ≤24h bank processing.

### Bets & Copy

**Duplicate ignored?** Slim-bet deduplication is intentional (`idempotencyKey` per slip — same `COM_` retry returns same result). Check My Bets — the single stake is the source of truth, not a missed bet.  
**“Insufficient balance” when copying.** Your slip amount (default ₦500) exceeds wallet — lower it or top up.  
**Copy not counting?** Copies are settled-stake counts batched on feeds; newly placed copies appear after the next feed refresh.  
**Insured?** 4+ leg accumulators with exactly one lost leg pay reduced accumulator (10% fee on reduced) — “Insured” chip in history.

### Auto-Cashout

**Badge says Armed but never fires?** Target must be ≤ live quote. While any leg is live, the quote is scaled (`LIVE_FACTOR` 0.75) — try a lower target or wait for legs to settle. Cap 5 per user / 200 platform.

### Bet Manager

**Locked 30 days?** AI needs the lock to deploy across cycles; unlocked portion is withdrawable at current NAV.  
**“No account for this tier”** — you have not deposited in that tier yet; the pool may still show Bet history (prospect `deposit-cta` banner encourages joining).  
**Partial withdraw?** Currently all unlocked at once; re-deposit immediately if desired.  
**NAV = ?** `(Pool Cash + Active Allocations) / Total Units` (see `bet-manager.service`).

### General

**Is my money safe?** Stake-back on Pods + governed by Terms of Service.  
**Dispute?** Ora chat or `support@betpool.tech`; disputed settlements go to admin review.

(End of guide — total ~520 lines; version history: 1.0 original, 2.0 social feed + inline comments, 2.1 creator economy + share + Bet Manager history + premium cover cards + wallet commission + For You immersive + double-tap + Ora callouts)
