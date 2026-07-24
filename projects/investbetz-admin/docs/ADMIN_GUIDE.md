# BetPool Admin Panel — Administrator Guide

**Version:** 2.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started — Admin Login & Navigation](#2-getting-started--admin-login--navigation)
3. [Dashboard](#3-dashboard)
4. [Pods — Bet Market Management](#4-pods--bet-market-management)
5. [Betting — External Booking Workflow](#5-betting--external-booking-workflow)
6. [Match Pools — Parimutuel Pools](#6-match-pools--parimutuel-pools)
7. [Users — Account Management](#7-users--account-management)
8. [Stakes — Bet Settlement & Review](#8-stakes--bet-settlement--review)
9. [Financials — Revenue & Transactions](#9-financials--revenue--transactions)
10. [Withdrawals — Payout Approval](#10-withdrawals--payout-approval)
11. [KYC — Identity Verification](#11-kyc--identity-verification)
12. [Transactions — Full Ledger](#12-transactions--full-ledger)
13. [BI Reports — Business Intelligence](#13-bi-reports--business-intelligence)
14. [Deposits — Deposit Management](#14-deposits--deposit-management)
15. [Campaigns — AI Marketing](#15-campaigns--ai-marketing)
16. [Featured Games — Home Screen Banners](#16-featured-games--home-screen-banners)
17. [Bet Manager — AI Portfolio Oversight](#17-bet-manager--ai-portfolio-oversight)
18. [ORA Chat — Conversation Monitoring](#18-ora-chat--conversation-monitoring)
19. [Settings — Platform Configuration](#19-settings--platform-configuration)
20. [Loan Management](#20-loan-management)
21. [AI System Overview](#21-ai-system-overview)

---

## 1. Overview

The BetPool Admin Panel is a comprehensive management interface for operating the entire betting and investment platform. It provides tools for:

- **Pod Lifecycle Management** — Create, publish, activate, settle, and curate betting markets.
- **User Management** — Suspend/activate accounts, manage KYC, view wallets and stakes.
- **Financial Oversight** — Monitor deposits, withdrawals, transactions, revenue, and risk.
- **AI Operations** — Run AI curation, automated settlement, KYC review, risk analysis, and campaigns.
- **Bet Manager** — Monitor AI-managed investment tiers, force-settle cycles, reconcile allocations.
- **ORA Chat** — Monitor and resolve user conversations with the AI assistant.
- **Content Management** — Featured banners, match pools, loan management.

**Theme:** Dark mode throughout. All data tables are paginated, filterable, and sortable.

---

## 2. Getting Started — Admin Login & Navigation

### 2.1 Login

**Route:** `/admin/login`

The admin login supports two methods:

| Method | Flow |
|--------|------|
| **Email Token** | Enter email → 6-digit code sent to inbox → verify |
| **PIN** | Direct PIN entry (4–6 digits) |
| **OTP** | Fallback — OTP sent to admin email |

On successful login, redirected to `/admin/dashboard`. The token is stored as `ib_token` in localStorage.

### 2.2 Sidebar Navigation

The sidebar contains 18 navigation items. It is collapsible via the toggle button at the top. When collapsed, only icons show. The admin user's name and role are displayed at the bottom with a logout button.

**Nav item order:**
1. Dashboard
2. Pods (with pending review badge count)
3. Betting
4. Match Pools
5. Users
6. Stakes
7. Financials (with pending withdrawals badge)
8. Withdrawals
9. KYC
10. Transactions
11. BI Reports
12. Deposits
13. Campaigns
14. Featured Games
15. Bet Manager
16. ORA Chat
17. Settings

---

## 3. Dashboard

**Route:** `/admin/dashboard`

### 3.1 Purpose

Central KPIs and AI-powered risk/performance overview. This is the first page admins see after login.

### 3.2 Key Metrics

| Metric | Source |
|--------|--------|
| Total Users | User collection count |
| Active Pods | Pods with status 'active' |
| Total Stakes | Lifetime stake count |
| Total Volume | Lifetime NGN wagered |
| Total Payouts | Lifetime NGN paid out |
| Pending Settlements | Pods awaiting settlement |

### 3.3 Daily Volume Chart

7-day rolling bar chart showing stake volume per day.

### 3.4 Pod Status Breakdown

Progress bars showing count of pods in each status: Draft / Published / Active / Settled / Cancelled.

### 3.5 AI Panels

#### Ora Financial Forecast
- Projected revenue, stake volume, new users, and net profit for next N days.
- Each metric shows: current value, previous period value, % change, projected next value, and confidence level (high/medium/low).

#### T4 Financial Health Advisory
- Overall health score (0–100%).
- Status indicators per metric: Profit Margin, User Growth, KYC Rate, Net Deposits, Churn Rate, Revenue Trend.
- Each indicator: good (green), warning (yellow), critical (red).
- Warnings and recommendations list.
- Previous health score with trend direction.

#### Ora Risk Dashboard
- Risk ratio % and level (low/medium/high/critical).
- Total reserves, total exposure, potential payout.
- **Reserve Projection:** Net available reserves, projected needed, deficit, suggested top-up, historical win rate, trend.
- **Escalation State:** Auto-cap status, pods suspended, creation frozen, escalation level (none/caution/warning/critical).

### 3.6 Actions

| Action | Effect |
|--------|--------|
| **Apply Auto-Caps** | AI caps max stakes on overexposed pods. |
| **Restore Caps** | Reverts auto-capped limits. |
| **Run Escalation** | Triggers full risk escalation check. |
| **Refresh Reports** | Reloads forecast/advisory data. |

---

## 4. Pods — Bet Market Management

**Route:** `/admin/pods`

### 4.1 Purpose

Full lifecycle management of Pods — the platform's core betting product. This is the most feature-rich section.

### 4.2 Pod States

```
Draft → Published → Active → Settled / Cancelled
                           ↘ Disputed → Resolved
```

### 4.3 Tabs

| Tab | Content |
|-----|---------|
| **Active** | Currently active pods (staking open, awaiting results) |
| **Past** | Settled, cancelled, and historic pods |
| **Disputed** | Pods flagged by AI as disputed (settlement disagreement) |

### 4.4 Data Table Columns

| Column | Description |
|--------|-------------|
| Match | Home vs Away with date |
| Status | Status chip (Draft/Published/Active/Settled/Cancelled) + sub-status for settlement |
| LIVE pill | Red pulsing badge for in-play events |
| Pick | Selected outcome + odds |
| Exposure | Progress bar: current exposure / max exposure |
| Stake Range | Min–Max stake allowed |
| Refund % | Stake-back guarantee % |
| Actions | Edit, View, Publish, Activate, Settle, AI Settle, Cancel, Curate |

### 4.5 Key Admin Actions

#### Creating a Pod

Click "Create Pod" → PodFormComponent opens with:

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Display name for the pod |
| Sport | Yes | Football, Basketball, Tennis, etc. |
| League | No | Competition name |
| Home Team | Yes | Home side name |
| Away Team | Yes | Away side name |
| Match Date | Yes | Date/time of the event |
| Market Type | Yes | 1X2, Double Chance, Over/Under, BTTS, Asian Handicap, Moneyline, Draw No Bet, Win to Nil |
| Selection | Yes | The recommended outcome |
| Odds | Yes | Gains multiplier (e.g., 2.50 = 2.5x) |
| Min Stake | Yes | Minimum wager |
| Max Stake | Yes | Maximum per bettor |
| Max Exposure | Yes | Total pool limit |
| Staking Closes | Yes | Deadline for stakes |
| Settlement Estimate | Yes | Expected settlement date |
| Is Live | No | Toggle for in-play events |
| Legs (Combined) | No | Multi-leg parlay support |

#### Publishing & Activating

1. **Publish:** Draft → Published (visible but not stakeable).
2. **Activate:** Published → Active (staking opens).

#### Settlement

**Manual:**
1. Click "Settle" on a pod.
2. Choose result: Win / Loss / Void.
3. Optional notes.
4. System calculates payouts/refunds.

**AI Settlement:**
1. Click "AI Settle" on a pod.
2. Ora AI fetches match results from sports API.
3. Displays: home/away score, match status, recommended result, confidence %, reasoning.
4. Admin reviews and confirms.

**AI Settle All:**
1. Click "AI Settle All".
2. Processes all active/published pods.
3. Results shown: settled count, disputed count, stuck count, errors.

#### Sync from API

1. Click "Sync Pods".
2. Enter days ahead (default 7).
3. System fetches upcoming fixtures from sports data API.
4. Auto-creates pods with AI-recommended selections.
5. Results: created count, skipped count, errors, API logs.

#### AI Curation

1. Click "Curate" button.
2. Ora AI analyzes upcoming fixtures.
3. For each fixture: verdict (RECOMMEND / SKIP), reasoning, recommended selections with confidence levels and suggested multipliers.
4. Admin can create pods directly from recommendations.

#### Dispute Resolution

1. Go to Disputed tab.
2. View disputed pods with dispute reason.
3. Click "Resolve" → choose result + add review note.
4. **Batch Resolve:** Select multiple disputed pods → choose result → add note → resolve all.

#### Stuck Pod Review

- Pods that cannot be auto-settled (no linked fixture data).
- Admin manually reviews and settles them.

### 4.6 Reserve Risk Bar

Visual indicator at the top showing:

- Reserve consumption %.
- Color-coded: safe (green), warning (yellow), danger (red).
- Worst-case scenarios: all-lose refunds vs all-win payouts.
- Current reserve amount.

### 4.7 Filters

| Filter | Type |
|--------|------|
| Status | Tab buttons (All/Past/Disputed) |
| Search | Text input |
| Date Range | From/To date pickers |
| Sport | Sub-filters under tabs |
| Sub-status | Chips (All/Published/Active/Settled/Cancelled) |

---

## 5. Betting — External Booking Workflow

**Route:** `/admin/betting`

### 5.1 Purpose

Manage pods that are ready for external booking with bookmakers. Tracks which pods have been physically placed with external partners.

### 5.2 Data Table

| Column | Description |
|--------|-------------|
| Select | Checkbox for batch actions |
| Pod | Title with sport/league |
| Pick | Selection + odds |
| Scores | Home:away if available |
| Outcome | Result chip or status |
| Legs | First leg title + count if parlay |
| Total Stakes | Volume wagered |
| Bettors | Participant count |
| Game Status | LIVE (pulsing) / Starting Soon / Upcoming / Awaiting Settlement / Finished |
| Booked | Toggle switch for external booking status |
| Stake Range | Allowed min/max |
| Place Bet | External action button |

### 5.3 Key Actions

| Action | Description |
|--------|-------------|
| **Toggle Booked (single)** | Click toggle on a pod to mark as booked externally |
| **Batch Toggle** | Select multiple pods → mark all as booked/unbooked |
| **AI Settle All** | Same as Pods section |
| **Place Bet** | Opens external URL for the pod |
| **Manual/AI Settle** | Same as Pods section |

### 5.4 Filters

| Filter | Type |
|--------|------|
| List Status | All / Ready / Settled |
| Search | Text |
| Sport | Dropdown |
| Booking Status | All / Not Booked / Booked |
| Page Size | Dropdown |

---

## 6. Match Pools — Parimutuel Pools

**Route:** `/admin/match-pools`

### 6.1 Purpose

Manage parimutuel-style betting pools where users stake on outcomes and winners share the pool proportionally. Platform takes 15% of the total pool.

### 6.2 Views

| View | Description |
|------|-------------|
| **List** | All pools with status, dates, pool size |
| **Create** | Form to create new pools |
| **Detail** | Full pool view with markets, stakes, settlement |
| **Reports** | Settlement stats and revenue |

### 6.3 Creating a Match Pool

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Event name (e.g., "Champions League Final — Goals") |
| Staking Closes | Yes | Deadline for stake entry |
| Min Stake | Yes | Minimum per bettor |
| Max Stake | Yes | Maximum per bettor |
| Markets | Yes | Dynamic list (min 2, add/remove) — each with label/description |

### 6.4 Detail View

| Section | Content |
|---------|---------|
| **Pool Info** | Staking close time, total pool, platform fee (15%), distributable amount, min/max stake, staker count |
| **Actions** | Close Staking, Cancel Pool, Settle |
| **Market Breakdown** | Cards: each market with total staked, staker count, winner indicator after settlement |

### 6.5 Settlement

1. Click "Settle".
2. Select winning market from dropdown.
3. See settlement preview:
   - Total pool, fee (15%), distributable amount.
   - Winning market total, winner count.
4. Confirm → pool settles → winners credited proportionally.

### 6.6 Reports

Stats across all settled pools:
- Settled pools count.
- Fee revenue generated.
- Average pool size.
- Unique stakers.
- Table of completed settlements.

---

## 7. Users — Account Management

**Route:** `/admin/users`  
**Detail:** `/admin/users/:id`

### 7.1 Purpose

View, search, suspend/activate user accounts, and manage KYC status.

### 7.2 User List

| Column | Description |
|--------|-------------|
| Phone | User's phone number (linked) |
| Name | Full name |
| Email | Email address |
| Status | Active (green) / Suspended (red) chip |
| KYC | Verified (green) / Pending (yellow) chip |
| Actions | Suspend/Activate toggle, Verify KYC |

**Search:** By phone, name, or email.

### 7.3 User Detail

| Section | Content |
|---------|---------|
| **Account Info** | Phone, name, email, status, KYC, join date. Actions: Suspend/Activate, Verify/Unverify KYC |
| **Wallet** | Balance, locked balance (active stakes), available balance, total won |
| **Recent Stakes** | User's N most recent stakes (pod, amount, status, date) |

---

## 8. Stakes — Bet Settlement & Review

**Route:** `/admin/stakes`

### 8.1 Purpose

View all user stakes (bets), manually settle, void, or review details.

### 8.2 Data Table

| Column | Description |
|--------|-------------|
| ID | Truncated stake ID |
| User | Bettor's name/phone |
| Amount | Wagered amount |
| Status | Colored chip |
| Date | When placed |
| Actions | View detail, Settle, Void |

### 8.3 Status Filters

All / Pending / Confirmed / Active / Won / Lost / Void / Cashed Out / Cancelled / Refunded

### 8.4 Stake Detail Panel (Expandable)

| Section | Content |
|---------|---------|
| **User Info** | Phone, name, email, user ID |
| **Stake Info** | ID, status, amount, potential payout, net payout, platform fee (35%), settlement date, notes |
| **Pod Info** | Title, sport, league, market, odds, stake range, selection, participant count |
| **Parlay Legs** | Each leg: teams, selection, odds, status |

### 8.5 Actions

| Action | Effect |
|--------|--------|
| **Settle** | Manually mark as Win, Loss, or Void |
| **Void** | Cancel the stake entirely |

---

## 9. Financials — Revenue & Transactions

**Route:** `/admin/financials`

### 9.1 Purpose

Central financial hub — summary cards, withdrawal management, transaction browsing, and manual wallet adjustments.

### 9.2 Summary Cards

| Metric | Description |
|--------|-------------|
| Total Stake Volume | Lifetime NGN wagered |
| Total Payouts | Lifetime NGN paid to users |
| Total Deposits | Lifetime NGN deposited |
| Total Withdrawals | Lifetime NGN withdrawn |
| Pending Withdrawals | Amount + count awaiting approval |
| Platform Revenue | Net platform earnings |

### 9.3 Tabs

#### Overview
- Daily stake volume bar chart (7-day).
- Recent activity table (type, user, amount, status, date).

#### Withdrawals
- Filter by status: All / Pending / Processing / Completed / Failed / Cancelled.
- Table: User, Amount, Account (name/number), Status, Date.
- **Detail Panel:** Reference, user, amount, fee, net, account name/number, status, created/completed dates, failure reason.
- **Actions:** Approve & Process / Reject (with reason).
- Paginated.

#### Transactions
- Filter by type: Deposit / Withdrawal / Stake / Payout / Refund / Adjustment.
- Filter by status: Completed / Pending / Failed / Cancelled.
- Table: Reference, User, Type (colored chip), Amount (+/- indicator), Status, Date.
- **Detail Panel:** Full breakdown.

### 9.4 Manual Wallet Adjustment

Modal accessible from the Financials page:

| Field | Required | Description |
|-------|----------|-------------|
| User ID | Yes | The user to adjust |
| Amount | Yes | NGN amount |
| Type | Yes | Credit (add) or Debit (deduct) |
| Reason | Yes | Explanation for audit trail |

---

## 10. Withdrawals — Payout Approval

**Routes:** `/admin/withdraw-mgt` and `/admin/withdrawals`

### 10.1 Purpose

Approve or reject user withdrawal requests.

### 10.2 Data Table

| Column | Description |
|--------|-------------|
| User | Name/phone |
| Amount | Requested amount |
| Fee | Platform fee |
| Bank | Destination bank |
| Account Number | Destination account |
| Status | Pending / Processing / Completed / Failed / Cancelled |
| Date | Request date |

### 10.3 Workflow

1. **Pending:** User requests withdrawal. Appears with "Pending" status.
2. **Approve:** Click "Approve" → processes the payout → status becomes "Processing" → eventually "Completed".
3. **Reject:** Click "Reject" → enter reason → status becomes "Cancelled" → user notified.

### 10.4 Status Filters

All / Pending / Processing / Completed / Failed / Cancelled

---

## 11. KYC — Identity Verification

**Route:** `/admin/kyc`

### 11.1 Purpose

Review and manage user Know-Your-Customer (KYC) submissions. Supports both manual and AI-powered review.

### 11.2 Data Table

| Column | Description |
|--------|-------------|
| Name | User's full name |
| Phone | Phone number |
| KYC Type | BVN or NIN |
| Status | Verified (green) / Pending (yellow) |
| Submitted | Date of submission |
| Actions | View, Approve, Reject, Ora Review |

### 11.3 Manual Review

1. Click "View" on a KYC entry.
2. See user info, KYC type, KYC number, status, submitted date.
3. **Approve:** Manually verify the user.
4. **Reject:** Enter rejection reason.

### 11.4 AI-Powered Review (Ora)

1. Click "Ora Review".
2. AI checks:
   - Names match between registration and BVN/NIN data.
   - Duplicate BVN/NIN across accounts.
   - Account age (days since signup).
   - Stake history (has the user placed bets? volume?).
   - Risk flags (suspicious patterns).
3. AI recommends: **Approve** / **Reject** / **Manual Review** (with confidence %).
4. Admin can "Execute AI Verdict" to apply the recommendation automatically.

### 11.5 Batch AI Review

Click "Review All Pending" → AI reviews all unverified KYC submissions → results table with verdicts → apply bulk.

### 11.6 Filters

Status (All / Pending / Verified), Search by name/phone.

---

## 12. Transactions — Full Ledger

**Route:** `/admin/transactions`

### 12.1 Purpose

Browse all financial transactions across the entire platform.

### 12.2 Data Table

| Column | Description |
|--------|-------------|
| Reference | Unique transaction reference |
| User | Name/phone |
| Type | Colored chip: Deposit / Withdrawal / Stake / Payout / Refund / Adjustment |
| Amount | Amount with +/- indicator |
| Status | Completed (green) / Pending (yellow) / Failed (red) / Cancelled (grey) |
| Date | Transaction date |

### 12.3 Filters

| Filter | Options |
|--------|---------|
| Type | All / Deposit / Withdrawal / Stake / Payout / Refund / Adjustment |
| Status | All / Completed / Pending / Failed / Cancelled |

### 12.4 Detail Panel (Expandable)

- Reference, User (name, phone).
- Type, Amount, Fee, Net Amount.
- Status, Provider (Paystack, Internal).
- Created Date, Completed Date.
- Description.
- Failure Reason (if failed).

---

## 13. BI Reports — Business Intelligence

**Route:** `/admin/bi-reports`

### 13.1 Purpose

AI-generated business intelligence reports with financial analytics. Powered by Ora.

### 13.2 Period Selector

Last 7 days / 30 days / 90 days.

### 13.3 Report Sections

#### Summary Cards

| Metric | Description |
|--------|-------------|
| Net Profit (or Loss) | Revenue minus payouts |
| Total Revenue | Platform earnings |
| Total Payouts | Amount paid to users |
| Total Stakes | Stake count |
| Users (New) | Total + new user count |

#### Ora's Analysis
AI-generated narrative about business performance for the selected period.

#### Month-over-Month Trends
| Trend | Indication |
|-------|------------|
| Stakes Change % | Up/down arrow (green/red) |
| Volume Change % | Up/down arrow |
| Revenue Change % | Up/down arrow |
| Users Change % | Up/down arrow |

#### Profit Breakdown
| Section | Content |
|---------|---------|
| By Sport | Sport, stakes, revenue, payouts, profit |
| By League | League, stakes, revenue, profit |
| Top Pods | Title, sport, stakes, volume, profit |
| Top Users | Phone, total staked, total won, bet count |

#### User & Financial Metrics
| Metric | Description |
|--------|-------------|
| Total Users | Registered user count |
| New Users | In the selected period |
| KYC Rate | % of users verified |
| Total Deposits | Lifetime deposits |
| Total Withdrawals | Lifetime withdrawals |
| Net Deposits | Deposits minus withdrawals |

---

## 14. Deposits — Deposit Management

**Route:** `/admin/deposit-mgt`

### 14.1 Purpose

View all deposit transactions across the platform.

### 14.2 Data Table

| Column | Description |
|--------|-------------|
| Reference | Paystack reference |
| User | Name/phone |
| Amount | NGN deposited |
| Fee | Transaction fee |
| Status | Completed / Pending / Processing / Failed / Cancelled |
| Date | Deposit date |

### 14.3 Detail Panel (Expandable)

- Reference, User.
- Amount, Fee, Net.
- Status, Provider (Paystack).
- Created Date, Completed Date.
- Description.
- Failure Reason.

### 14.4 Filters

Status: All / Pending / Processing / Completed / Failed / Cancelled.

---

## 15. Campaigns — AI Marketing

**Route:** `/admin/campaigns`

### 15.1 Purpose

AI-powered user engagement campaigns. Uses Ora AI to segment users and generate personalized messages.

### 15.2 Workflow

```
Select Segment → Generate AI Messages → Preview → Send
```

### 15.3 Step 1: Select Segment

Segment cards display with user count:

| Segment | Description |
|---------|-------------|
| Recent Winners | Users who won recently |
| Inactive Users | Users dormant for N days |
| High-Value | Users with high stake volume |
| Churned | Formerly active, now inactive |
| (Dynamic) | Additional AI-generated segments |

### 15.4 Step 2: Generate AI Messages

Click "Generate" → Ora AI creates personalized messages for each user:

| Field | Description |
|-------|-------------|
| Subject | Email subject line |
| In-App Title | Notification title |
| In-App Message | Short push message |
| SMS Text | SMS body |
| Email HTML | Full HTML email |

### 15.5 Step 3: Preview

Scroll through generated messages per user. Each shows: name/phone, all message fields.

### 15.6 Step 4: Send

Click "Send All" → messages dispatched via In-App + SMS channels. Results: sent count, failed count.

---

## 16. Featured Games — Home Screen Banners

**Route:** `/admin/featured-games`

### 16.1 Purpose

Manage the rotating banner carousel displayed on the user's home page (`/home`).

### 16.2 Banner Properties

| Property | Required | Description |
|----------|----------|-------------|
| Title | Yes | Headline text |
| Subtitle | No | Secondary text |
| Description | No | Body text (AI-generatable) |
| Emoji | No | Emoji icon |
| CTA Label | No | Button text |
| CTA Link | No | Button destination URL |
| Gradient Start | Yes | Left color |
| Gradient End | Yes | Right color |
| Display Order | Yes | Sort position |
| Is Active | Yes | Toggle visibility |
| Start At | No | Scheduled start |
| Expires At | No | Auto-hide after |

### 16.3 Actions

| Action | Description |
|--------|-------------|
| **Create** | Full form with live preview card that updates as you type |
| **Edit** | Pre-filled form for existing banners |
| **Delete** | With confirmation dialog |
| **Ora Generate** | Click "Generate Description" → AI writes description from title + subtitle |

### 16.4 Banner List

Cards showing: gradient preview strip, emoji, title, subtitle, active/inactive badge, display order, edit/delete buttons.

---

## 17. Bet Manager — AI Portfolio Oversight

**Route:** `/admin/bet-manager`

### 17.1 Purpose

Monitor and manage the Bet Manager — BetPool's AI-managed investment product. Users deposit into risk tiers (Defender/Midfielder/Striker), funds are pooled and automatically allocated across Pods and Match Pools.

### 17.2 Dashboard View

#### Stats Cards

| Metric | Description |
|--------|-------------|
| Total AUM | Total Assets Under Management across all tiers |
| Active Accounts | Number of users with active Bet Manager accounts |
| Fees Collected | Lifetime platform + performance fees |
| Active Cycles | Number of active 30-day investment cycles |

#### Tier Cards

Clickable cards for each tier:

| Tier | Color | Shows |
|------|-------|-------|
| 🛡️ Defender | Green | Account count, AUM, pool balance |
| ⚡ Midfielder | Yellow | Account count, AUM, pool balance |
| 🎯 Striker | Red | Account count, AUM, pool balance |

Click a tier card → drill into tier detail view.

### 17.3 Pool Wallets

Table showing the 3 pool wallet addresses and their current NGN balances. These are shared wallets that hold all user funds per tier.

### 17.4 Cycles

| Column | Description |
|--------|-------------|
| Tier | Defender / Midfielder / Striker |
| Cycle # | Auto-incrementing cycle number |
| Start Date | When cycle began |
| End Date | When cycle ends (30 days after start) |
| Start NAV | Net Asset Value at cycle start |
| End NAV | Ending NAV (null if active) |
| Profit | Net profit for the cycle |
| Fees | Performance fee + platform fee collected |
| Status | Active (green) / Settled (blue) |
| Action | "Force Settle" button for active cycles |

### 17.5 User Accounts

Searchable table:

| Column | Description |
|--------|-------------|
| User | Name + phone |
| Tier | Tier chip |
| Units | Units held |
| Current Value | Units × current NAV |
| Deposited | Total lifetime deposits |
| Withdrawn | Total lifetime withdrawals |
| Current NAV | Latest NAV price |
| Actions | View detail button |

### 17.6 Deposits / Withdrawals

Filterable by tier and status:

| Column | Description |
|--------|-------------|
| User | Name + phone |
| Tier | Tier chip |
| Type | Deposit (green) / Withdrawal (red) chip |
| Amount | NGN amount |
| Units | Units issued/redeemed |
| NAV | NAV at execution |
| Status | Locked (yellow) / Unlocked (green) / Withdrawn (grey) |
| Date | Transaction date |

### 17.7 Tier Detail (Drill-down)

Click a tier card → detailed view:

| Section | Content |
|---------|---------|
| **Info** | Current NAV, total value, pool balance, active accounts, total deposits, active allocations, settled cycles, total fees |
| **Active Cycle** | Cycle #, start/end dates, cash balance, total staked |
| **NAV History** | All cycles: cycle #, start/end dates, starting/ending NAV, return % |

### 17.8 Account Detail Modal

Click "View" on a user account:

| Section | Content |
|---------|---------|
| **Account** | User, tier, units, total deposited/withdrawn, total profit |
| **Recent Transactions** | Type, amount, units, NAV, status, date |

### 17.9 Admin Actions

| Action | Description |
|--------|-------------|
| **Force Settle Cycle** | Manually settle an active cycle for a tier. Calculates ending NAV, deducts performance fee (20% of profit), closes cycle, opens new one. |
| **Reconcile Allocations** | Check all active allocations against pod statuses. Collects returns from settled pods, refunds from cancelled pods. |

---

## 18. ORA Chat — Conversation Monitoring

**Route:** `/admin/ora-chat`

### 18.1 Purpose

Monitor and manage user conversations with the Ora AI assistant.

### 18.2 Stats Cards

| Metric | Description |
|--------|-------------|
| Total | All conversations |
| Active | Currently active conversations |
| Escalated | Flagged for admin attention |
| Resolved | Completed conversations |

### 18.3 Session List (Left Panel)

| Element | Description |
|---------|-------------|
| Avatar | User initials |
| Name | User's full name |
| Last Message | Preview (truncated to 80 chars) |
| Last Activity | Relative time (e.g., "2 min ago") |
| Status | Active / Escalated / Resolved chip |
| Message Count | Number of messages in thread |
| Escalation Badge | Bell icon if escalation not yet notified |

### 18.4 Conversation Detail (Right Panel)

| Section | Content |
|---------|---------|
| **User Info** | Name, phone, email |
| **Status** | Current conversation status chip |
| **Escalation** | Keyword-based reason for escalation |
| **Mark Resolved** | Button to close the conversation |
| **Message Thread** | Each message: role label (User / ORA AI / System), content, timestamp |

### 18.5 Actions

| Action | Description |
|--------|-------------|
| **Filter by Status** | Active / Escalated / Resolved (clickable stats cards) |
| **Search** | By user name, phone, or email |
| **Select Conversation** | Click to view full thread |
| **Mark Resolved** | Resolve any active or escalated conversation |

---

## 19. Settings — Platform Configuration

**Route:** `/admin/settings`

### 19.1 Purpose

Platform-level configuration settings.

### 19.2 Settings Available

| Setting | Description |
|---------|-------------|
| **Reserve Amount** | The platform reserve in NGN. Used to calculate risk consumption on the Pods page. Represents maximum liability the platform can absorb. |

### 19.3 How Reserve Risk is Calculated

The reserve bar on the Pods page shows:
- If all pods lose: total refunds = sum of (exposure × refund%).
- If all pods win: total payouts = sum of (exposure × odds × 0.9).
- The bar displays the **higher** of the two values against the reserve.
- Color-coded: safe (<50%), warning (50–80%), danger (>80%).

### 19.4 Actions

| Action | Description |
|--------|-------------|
| View current reserve amount | Displayed in input field |
| Edit reserve amount | Update the value |
| Save | Persist changes |

---

## 20. Loan Management

**Route:** `/admin/loan-mgt`

### 20.1 Purpose

Manage user loans — create, approve, reject, and track repayments.

### 20.2 Data Table

| Column | Description |
|--------|-------------|
| User | Name/phone |
| Amount | Loan amount |
| Purpose | What the loan is for |
| Interest | Percentage rate |
| Status | Pending / Approved / Active / Repaid / Defaulted / Rejected |
| Requested | Date of request |
| Due Date | Repayment deadline |
| Actions | View detail, Approve, Reject, Mark Repaid |

### 20.3 Detail Panel (Expandable)

| Field | Description |
|-------|-------------|
| User | Name, phone (linked) |
| Amount | Loan principal |
| Interest Rate | % |
| Repayment Amount | Principal + interest |
| Purpose | User-provided reason |
| Status | Current status chip |
| Requested At | Date |
| Approved At | Date (if approved) |
| Approved By | Admin who approved |
| Due Date | Repayment deadline |
| Repaid At | Date of full repayment |
| Note | Admin notes |

### 20.4 Actions

| Action | Description |
|--------|-------------|
| **Create New Loan** | Form: User ID, Amount, Purpose, Interest Rate (default 5%), Due Date |
| **Approve & Credit** | Approves pending loan, credits user wallet with loan amount |
| **Reject** | Reason required |
| **Mark Repaid** | For approved/active loans |

### 20.5 Filters

Status: All / Pending / Approved / Active / Repaid / Defaulted / Rejected.

---

## 21. AI System Overview

BetPool has a comprehensive AI sub-system called **Ora** that powers automation across the platform:

### 21.1 Ora Components

| Component | Function | Schedule |
|-----------|----------|----------|
| **Curation** | Analyzes upcoming sports fixtures and recommends Pod creation with optimal selections and odds. | On-demand (admin-triggered) |
| **Settlement** | Checks match results via sports API, recommends Win/Loss/Void for pods, flags disputes, handles stuck pods. | Automated + on-demand |
| **KYC Review** | Verifies user identity documents (BVN/NIN), checks for duplicates, recommends approval/rejection. | On-demand (admin-triggered) |
| **Risk Management** | Monitors platform risk ratio, auto-caps overexposed pods, suspends pods, escalates to critical state if needed. | Automated (6-hour cycle) |
| **BI Reporting** | Generates business intelligence reports, forecasts, and T4 financial health advisories. | On-demand (admin views) |
| **Campaigns** | Segments users, generates personalized marketing messages, sends via in-app + SMS. | On-demand (admin-triggered) |
| **Bet Manager Allocation** | Daily allocates pooled user funds across active pods and match pools based on tier parameters. | Automated (6-hour cycle) |

### 21.2 Automation Cycle

Every 6 hours, the automation service runs:

1. **Unlock Deposits:** Matures Bet Manager deposits that have passed 30-day lock.
2. **Reconcile Allocations:** Collects returns from settled pods, refunds from cancelled pods.
3. **Settle Cycles:** Closes Bet Manager cycles that have passed their end date, calculates NAV and fees.
4. **Allocate Daily:** Distributes available pool cash to pods within each tier's multiplier range.

### 21.3 Admin Overrides

Admins can override AI decisions at any point:
- Manually settle pods.
- Manually resolve disputes.
- Manually approve/reject KYC.
- Force-settle Bet Manager cycles.
- Manually reconcile allocations.
- Override risk caps.

---

## Appendix A: Bet Manager Tier Parameters

| Parameter | Defender | Midfielder | Striker |
|-----------|----------|------------|---------|
| Min Deposit | 50,000 NGN | 100,000 NGN | 200,000 NGN |
| Max Allocation % of Pool | 80% | 85% | 90% |
| Min Multiplier | 1.2x | 1.5x | 2.0x |
| Max Multiplier | 1.8x | 2.5x | 5.0x |
| Platform Fee | 500 NGN | 500 NGN | 500 NGN |
| Performance Fee | 20% of profit | 20% of profit | 20% of profit |
| Lock Period | 30 days | 30 days | 30 days |

## Appendix B: Fee Structure

| Product | Fee | Details |
|---------|-----|---------|
| Pods (Singles) | 35% of net profit | On settlement |
| Pods (Accumulator) | 35% of net profit | On settlement |
| Match Pools | 15% of total pool | On settlement |
| Bet Manager | 20% of performance profit | Per cycle settlement |
| Bet Manager | 500 NGN platform fee | Per cycle |
| Withdrawals | 1.5% (max 50 NGN) | Per transaction |
| Cashout | 10% of stake | Early settlement fee |

## Appendix C: Pod Status Lifecycle

```
Draft ──→ Published ──→ Active ──→ Settled
  │                       │           │
  │                       │           ├── Won
  │                       │           ├── Lost (Refund)
  │                       │           └── Void
  │                       │
  │                       └── Cancelled
  │
  └── Deleted (hidden)
```

## Appendix D: Error Codes & Resolution

| Issue | Likely Cause | Resolution |
|-------|-------------|------------|
| "Account not found" | Invalid user ID | Check the user exists in Users page |
| "Pod not found" | Deleted or invalid pod ID | Check Pods page for the pod |
| "Insufficient balance" | User has insufficient funds | Check Wallet in User Detail |
| "Settlement failed" | API or data error | Try AI Settle Check first, then manual |
| "Cycle already settled" | Double-submit | Refresh and check Cycles table |
| "Invalid tier" | Wrong tier name | Use: defender/midfielder/striker |
