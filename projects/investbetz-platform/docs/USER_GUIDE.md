# BetPool Platform — User Guide

**Version:** 2.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started — Registration & Login](#2-getting-started--registration--login)
3. [Home — The Betting Feed](#3-home--the-betting-feed)
4. [Wallet — Deposits & Withdrawals](#4-wallet--deposits--withdrawals)
5. [My Bets — Stake Tracking & Cashout](#5-my-bets--stake-tracking--cashout)
6. [Match Pools — Parimutuel Betting](#6-match-pools--parimutuel-betting)
7. [Bet Manager — AI-Managed Portfolios](#7-bet-manager--ai-managed-portfolios)
8. [Profile — Account Management](#8-profile--account-management)
9. [Notifications](#9-notifications)
10. [Legal Pages](#10-legal-pages)
11. [Key Concepts & Terminology](#11-key-concepts--terminology)
12. [Troubleshooting & FAQ](#12-troubleshooting--faq)

---

## 1. Overview

BetPool is a sports betting and AI-managed investment platform. Users can:

- **Place single and accumulator (parlay) bets** on curated Pods — expert-selected betting markets with stake-back guarantees.
- **Bet on Match Pools** — parimutuel pools where you share the pool proportionally with winners.
- **Invest in Bet Manager** — deposit funds into AI-managed tiers (Defender/Midfielder/Striker) where the Ora AI automatically allocates capital across Pods and Match Pools.
- **Deposit/Withdraw funds** via Paystack (bank transfer, card, USSD).
- **Cash out** active bets early (with a fee).
- **Track performance** across all products.
- **Chat with Ora AI** for support and questions.

### Device Support

The platform has separate layouts for desktop and mobile. Most features detect your device and render the appropriate view automatically.

---

## 2. Getting Started — Registration & Login

### 2.1 Landing Page (`/`)

The public marketing page. Anyone can browse it without an account. Key sections:

- **Hero:** "Your Money is Safe at BetPool" — highlights the stake-back guarantee.
- **How It Works:** 3-step explanation (Choose a Pod, Place a Bet, Win or Get Staked Back).
- **Testimonials:** Real user quotes.
- **Stats:** 50K+ users, 2.5B+ NGN paid out.
- **FAQ:** 5 common questions.
- **Footer:** Links to Terms of Service, Privacy Policy, and Cookie Policy.

**Actions:** Click "Create Your Free Account" to sign up, or "Sign In" to log in.

### 2.2 Sign Up (`/auth/signup`)

| Step | Field | Details |
|------|-------|---------|
| 1 | Full Name | Your legal name |
| 1 | Phone Number | Nigerian mobile (+234 auto-prefixed) |
| 1 | Email (optional) | For email notifications |
| 1 | Agree to Terms | Checkbox required |
| 2 | OTP Verification | 6-digit code sent via SMS (+ email if provided) |
| 3 | Set PIN | 6-digit numeric PIN (used for withdrawals and login) |

After completing all steps, you are automatically logged in and redirected to `/home`.

### 2.3 Login (`/auth/login`)

Three login methods:

| Method | How it works |
|--------|-------------|
| **PIN** | Enter phone number + 6-digit PIN. Fastest method. |
| **Email Token** | Enter email → receive 6-digit code → verify. |
| **OTP** | Enter phone → receive SMS OTP → verify. |

On success, you are redirected to your intended page (or `/home`).

### 2.4 Password/PIN Reset

- **Forgot PIN:** Request reset via OTP → verify → set new PIN.
- **Change PIN (while logged in):** Profile → Security → Change PIN (current → new → confirm).

---

## 3. Home — The Betting Feed

**Route:** `/home`  
**Purpose:** Browse and place bets on active Pods.

### 3.1 Top Navigation Bar

| Element | Description |
|---------|-------------|
| Logo | BetPool brand |
| Wallet Balance | Your available balance — click "Top Up" to deposit |
| Active Bets | Number of active stakes — click to view |
| Notification Bell | Unread count badge — click to open dropdown |
| Nav Links | Home, Match Pools, Bet Manager, My Bets, Wallet, Profile |
| Logout | Sign out |

### 3.2 Featured Banners

Rotating promotional banners at the top of the page. Managed by admins. Each has a CTA button that links to the featured promotion.

### 3.3 Sport Filters

Tabs at the top: **All Sports**, **Football**, **Basketball**, **Tennis**, etc. Click to filter visible Pods by sport.

### 3.4 Pod Cards

Each Pod is a curated betting market with:

| Field | Description |
|-------|-------------|
| Match | Home Team vs Away Team |
| League | Competition name (e.g., Premier League) |
| Selection | The recommended bet (e.g., Home Win, Over 2.5 Goals) |
| Odds | Gains multiplier (e.g., 2.50x) |
| Min Stake | Minimum amount to bet |
| Stake Range | Min–Max allowed |
| Exposure Bar | Visual — how much of the max pool has been staked |
| Countdown | Time until staking closes |
| Refund % | If the pod loses, this % is refunded (stake-back guarantee) |

**Actions per Pod:**
- **Place Stake:** Opens the Stake Modal → enter amount → confirm.
- **Add to Accumulator (+):** Adds the selection to your Bet Slip (max 5 legs).

### 3.5 Stake Modal (Single Bet)

| Step | What happens |
|------|-------------|
| 1 | Enter stake amount (min/max enforced). Quick-select buttons available. |
| 1 | See potential payout = stake × odds. |
| 1 | Platform fee (35% of profit) shown. Net payout displayed. |
| 2 | Review terms. Click "Confirm Stake". |
| | `POST /stakes` called. Wallet refreshes. |

### 3.6 Accumulator / Parlay Bet Slip

- **Add selections:** Click "+" on up to 5 Pods.
- **Combined multiplier:** All odds multiplied together.
- **Stake:** Enter one amount for all legs.
- **Payout:** Combined odds × stake (minus platform fee).
- **Place:** Click "Place Accumulator" → `POST /stakes` with multiple `podIds`.

### 3.7 Search

Search bar at the top — type a team name, league, or sport. Results filter in real-time (debounced 300ms).

### 3.8 Wallet Top-Up

Click "Top Up" in the nav bar → opens modal → select amount (or custom) → initiates Paystack payment → redirects to Paystack → on success, returns to wallet.

---

## 4. Wallet — Deposits & Withdrawals

**Route:** `/wallet`  
**Purpose:** Manage your funds on the platform.

### 4.1 Wallet Dashboard

| Stat | Description |
|------|-------------|
| Available Balance | Funds you can bet or withdraw |
| Total Balance | Available + locked (active stakes) |
| Total Deposited | Lifetime deposits |
| Total Withdrawn | Lifetime withdrawals |
| Total Staked | Lifetime stake volume |
| Total Winnings | Lifetime winnings (net) |

### 4.2 Deposit

| Step | Description |
|------|-------------|
| 1 | Click "Deposit" or "Top Up" |
| 2 | Select amount: 5K / 10K / 20K / 50K / 100K / 500K / Custom |
| 3 | Click "Deposit" → `POST /wallet/deposit` → redirect to Paystack |
| 4 | Complete payment on Paystack (card, bank transfer, USSD) |
| 5 | Automatic redirect back → callback verifies → wallet updates |

**Limits:** Min 5,000 NGN, Max 1,000,000 NGN per transaction.

### 4.3 Withdraw

**Route:** `/wallet/withdraw`

| Step | Description |
|------|-------------|
| 1 | Enter amount (min 500, max 5M, daily limit 10M) |
| 2 | Select your bank (search from 50+ Nigerian banks) |
| 3 | Enter 10-digit account number → name auto-resolves |
| 4 | Enter 4-digit withdrawal PIN |
| 5 | (Optional) Save account for future use |
| 6 | Submit → `POST /wallet/withdraw` |

**Fees:** 1.5% of amount, max 50 NGN.

**Saved Accounts:** Save bank accounts for faster withdrawals. Set a default account. Manage from the withdrawal page.

### 4.4 Transaction History

Tabbed view:
- **All:** All transactions combined.
- **Deposits:** Only deposit transactions.
- **Withdrawals:** Only withdrawal transactions.

Each row shows: Date, Type (Deposit/Withdrawal), Description, Amount (with +/-), Status (Completed/Pending/Failed).

---

## 5. My Bets — Stake Tracking & Cashout

**Route:** `/bets`  
**Purpose:** View active and historical bets.

### 5.1 Summary Cards

| Card | Description |
|------|-------------|
| Active | Current live bets |
| Won | Bets that won |
| Refunded | Bets refunded (pod lost but stake-back applied) |
| Void | Cancelled/voided bets |

### 5.2 Active Bets Tab

- Lists all stakes currently in play.
- Each row shows: match, selection, odds, stake amount, potential payout.
- **Cashout** button on eligible stakes:
  - Opens Cashout Modal.
  - Shows cashout value = remaining stake × (1 - cashout fee).
  - Fee: 10% of stake amount.
  - `GET /stakes/:id/cashout/quote` → `POST /stakes/:id/cashout/confirm`.

### 5.3 History Tab

Paginated table of settled stakes:

| Column | Description |
|--------|-------------|
| Date | When the stake was placed |
| Selection | The Pod name + picked outcome |
| Odds | Multiplier at time of stake |
| Stake | Amount wagered |
| Potential Payout | What it would have paid |
| Status | Won / Refunded / Cashed Out / Void / Cancelled |
| Result | Profit (green) or neutral |

Parlays show leg count and each leg's individual status.

Active stakes poll every 30 seconds for status updates.

---

## 6. Match Pools — Parimutuel Betting

**Route:** `/match-pools`  
**Purpose:** Bet on match outcomes where the pool is shared among winners proportionally.

### 6.1 How Match Pools Work

> Unlike Pods (fixed-odds), Match Pools are **parimutuel**. You bet on an outcome within a pool. If your outcome wins, you share the pool (minus 15% platform fee) proportionally with others who picked the same outcome. **Losing stakes are NOT refunded.**

### 6.2 Pool List

| Stat | Description |
|------|-------------|
| Total Pools | All pools ever created |
| Open Pools | Pools still accepting stakes |
| Combined Pool | Total NGN across all pools |
| My Stakes | Number of pools you've bet in |

### 6.3 Pool Card (Expanded)

- Pool title (e.g., "Match Day 5 — Goals Markets").
- Staking closes countdown.
- **Markets:** Each possible outcome with:
  - Label (e.g., "Over 2.5 Goals").
  - Total staked amount.
  - Percentage of pool.
  - Ranking icon (1st, 2nd, trailing).

### 6.4 Placing a Pool Stake

1. Tap a market in the pool card.
2. Enter stake amount (min/max enforced per pool).
3. Confirm → `POST /match-pools/:poolId/stakes`.

### 6.5 My Stakes Tab

Table showing your pool stakes: event, market selected, stake amount, potential payout, status (Open/Won/Lost/Settled), date.

---

## 7. Bet Manager — AI-Managed Portfolios

**Route:** `/bet-manager`  
**Purpose:** Let BetPool's Ora AI invest your balance across Pods and Match Pools automatically.

### 7.1 Concept

> The Bet Manager is a **mutual-fund-style** investment product. You deposit into a risk tier. The AI daily allocates the pooled cash across live Pods and Match Pools. Returns flow back into the pool, growing the Net Asset Value (NAV). BetPool takes a 20% performance fee only on net profit.

### 7.2 Three Tiers

| Tier | Min Deposit | Strategy | AI Allocation Range | Color |
|------|-------------|----------|-------------------|-------|
| 🛡️ Defender | 50,000 NGN | Conservative — low-risk Pods, high refund confidence | 1.2x–1.8x multiplier Pods | Green |
| ⚡ Midfielder | 100,000 NGN | Balanced — mix of Pods and Match Pools | 1.5x–2.5x Pods + Match Pools | Yellow |
| 🎯 Striker | 200,000 NGN | Aggressive — higher multipliers, more Match Pools | 2x–5x Pods + more Match Pools | Red |

### 7.3 Overview Page (`/bet-manager`)

Shows all 3 tiers in card layout:

- **If no portfolio:** Shows min deposit, "Get Started" button.
- **If active portfolio:** Shows:
  - Portfolio Value (current).
  - Total Deposited.
  - Profit/Loss.
  - Buttons: **View Details**, **Deposit More**, **Withdraw All**.

How-it-works guide (toggleable): 4-step explanation.

### 7.4 Deposit into a Tier (`/bet-manager/deposit/:tier`)

| Step | Description |
|------|-------------|
| 1 | Select tier from overview |
| 2 | Choose amount: min deposit, 2× min, 5× min, or custom |
| 3 | Review: amount, 30-day lock period, 20% performance fee |
| 4 | Submit → `POST /bet-manager/deposit` → funds moved from wallet → units issued at current NAV |

**Lock Period:** 30 days from deposit date. During this time, the deposit cannot be withdrawn.

### 7.5 Tier Detail Page (`/bet-manager/:tier`)

Drill-down view:

| Section | Content |
|---------|---------|
| **Hero** | Portfolio value, current NAV, total deposited, P&L, locked balance, unlockable balance |
| **NAV History** | Per-cycle bar chart showing starting NAV, ending NAV, return % |
| **Performance** | Current value, total deposited, return %, cycle-by-cycle breakdown table |
| **History** | Deposit & withdrawal records with type, amount, units, NAV at execution, date, status (locked/unlocked/withdrawn) |
| **Withdraw** | Button (only when unlocked balance > 0) → confirmation modal → withdraws all unlocked value at current NAV |

### 7.6 Withdrawal

- Only unlocked deposits (older than 30 days) can be withdrawn.
- Withdrawing resets your units to 0 for that tier.
- You can re-deposit anytime.
- Withdraw confirmation dialog prevents accidents.

---

## 8. Profile — Account Management

**Route:** `/profile`  
**Purpose:** Manage your account settings, security, KYC, referrals, and support.

### 8.1 Personal Info

| Field | Action |
|-------|--------|
| Full Name | Edit and save |
| Email | Edit and save |
| Phone | Read-only (contact support to change) |

### 8.2 Security

| Feature | Description |
|---------|-------------|
| **Change PIN** | Enter current PIN → new PIN → confirm → `POST /auth/pin/change` |
| **Phone Verification** | Request OTP → enter 6-digit code → verify |
| **KYC Verification** | 3-step process: (1) Verify phone (2) Submit BVN or NIN (11-digit) (3) Address (coming soon) |

### 8.3 KYC Details

- **Type:** BVN (Bank Verification Number) or NIN (National Identification Number).
- **Submit:** Enter BVN or NIN number → `POST /auth/kyc`.
- **Status:** Check from the profile page.
- **Why?** Required for withdrawals above certain limits and regulatory compliance.

### 8.4 Referrals

| Element | Description |
|---------|-------------|
| Referral Code | Your unique code — share with friends |
| Share | Uses Web Share API or copies to clipboard |
| Stats | Total referrals earned, bonus earned |
| Rules | How the referral program works |

### 8.5 Support

| Channel | Description |
|---------|-------------|
| **Ora AI Chat** | AI assistant — asks quick questions like "What's my balance?", "How do I place a bet?", "Deposit help", "KYC help", or type your own question |
| **FAQ** | 5 common questions with answers |
| **Email** | `support@betpool.tech` |

---

## 9. Notifications

**Route:** `/notifications`  
**Purpose:** In-app notification inbox.

### 9.1 Features

- **All / Unread** filter tabs.
- Each notification: type icon (color-coded), title, message, time ago.
- **Mark as Read / Unread** — click the dot.
- **Delete** — remove a notification.
- **Mark All Read** — bulk action.
- Pagination for large lists.

### 9.2 Notification Types

| Type | Icon Color | Example |
|------|-----------|---------|
| Deposit | Green | "Your deposit of 50,000 NGN was confirmed." |
| Withdrawal | Red | "Withdrawal of 20,000 NGN processed." |
| Stake | Blue | "Your bet on Man United won!" |
| Payout | Green | "Payout of 125,000 NGN credited." |
| Referral | Purple | "Your referral John just signed up!" |
| KYC | Yellow | "Your KYC has been verified." |
| Auth | Grey | "New login from Lagos, Nigeria." |
| System | Orange | "Platform maintenance tonight at 2 AM." |

---

## 10. Legal Pages

| Route | Content |
|-------|---------|
| `/terms` | Terms of Service — acceptance, eligibility (18+), account rules, deposits/withdrawals, pods/stakes, cashout, referral program, liability limits |
| `/privacy` | Privacy Policy — data collection, usage, sharing, security, cookies, user rights |
| `/cookies` | Cookie Policy — what cookies we use, why, how to control them |

---

## 11. Key Concepts & Terminology

| Term | Definition |
|------|------------|
| **Pod** | A curated betting market with fixed odds and a stake-back guarantee. Created by BetPool experts or the Ora AI. |
| **Stake** | The amount you wager on a Pod or Match Pool market. |
| **Accumulator (Parlay)** | A single bet that combines multiple selections. All must win for the bet to pay out. |
| **Cashout** | Settle an active bet early for a reduced amount (10% fee applies). |
| **Stake-Back Guarantee** | If a Pod loses, a percentage (e.g., 100%) of your stake is refunded. |
| **Match Pool** | Parimutuel betting — stakes are pooled, winners share the pool proportionally. |
| **Bet Manager** | AI-managed investment tiers. Deposit → AI allocates → returns grow NAV → withdraw after 30-day lock. |
| **NAV** | Net Asset Value — the price per unit in a Bet Manager tier pool. |
| **Performance Fee** | 20% of net profit taken by BetPool when a Bet Manager cycle settles. |
| **Platform Fee** | 35% of net profit on bets (Pods). 15% of pool (Match Pools). |

---

## 12. Troubleshooting & FAQ

### Login Issues

**Q: I forgot my PIN.**
A: Use the OTP login method, then change your PIN from Profile → Security.

**Q: I'm not receiving OTP.**
A: Check your SMS inbox. If using email, check spam. You can resend after 60 seconds.

### Deposit Issues

**Q: My deposit is not showing.**
A: The wallet auto-checks for pending deposits on page load. If still missing, contact support via Ora AI chat or email.

**Q: Paystack redirected but wallet didn't update.**
A: Try navigating to Wallet — it checks pending deposits on load. If the issue persists, contact support.

### Withdrawal Issues

**Q: Why can't I withdraw?**
A: Possible reasons: (1) Daily limit exceeded (10M). (2) Insufficient available balance. (3) Unverified account (KYC not done). (4) Withdrawal PIN incorrect.

**Q: How long do withdrawals take?**
A: Bank transfers typically process within 24 hours on business days.

### Bet Manager

**Q: Why is my balance locked for 30 days?**
A: The 30-day lock allows the AI to deploy capital across betting cycles. After 30 days, deposits unlock and can be withdrawn at current NAV.

**Q: Can I withdraw only part of my unlocked balance?**
A: Currently, withdrawal withdraws all unlocked value at once. You can re-deposit immediately.

**Q: How is the NAV calculated?**
A: NAV = (Pool Cash Balance + Value of Active Allocations) / Total Units Issued.

### General

**Q: Is my money safe?**
A: BetPool has a stake-back guarantee on all Pods. Platform usage is governed by our Terms of Service.

**Q: What if I have a dispute?**
A: Contact support via the Ora AI chat or email `support@betpool.tech`. Disputed settlements are reviewed by admins.
