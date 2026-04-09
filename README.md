# Wait a Minute ⏳

### Queue Transactions. Save on Fees. Support Solana.

**Frontier Hackathon 2026 — Solflare Track (Eitherway)**

---

## One-Liner

A transaction queuing layer for Solflare wallet that lets users voluntarily delay non-urgent transactions, smoothing out network demand spikes in exchange for fee discounts.

---

## The Problem

Solana processes 65,000+ TPS, but demand isn't uniform — it comes in bursts. During peak congestion windows (NFT mints, token launches, high-activity DeFi periods), users compete for blockspace, driving up priority fees and degrading UX for everyone. There's currently no mechanism for users to say: *"This transaction isn't urgent — I'm happy to wait."*

---

## The Solution

**Wait a Minute** adds an opt-in delay button to any transaction flow via Solflare wallet. Before confirming, users can press **"I Can Wait"** and select a delay window (15s, 30s, 60s, or 2 minutes). The transaction is held client-side, then submitted after the delay — ideally landing during a lower-congestion slot.

**The incentive:** Users receive a percentage discount on their transaction fee proportional to the wait time — up to 30% off for a 2-minute delay.

---

## How It Works

```
User initiates transaction in dApp
        ↓
"I Can Wait" button appears (via Wait a Minute SDK)
        ↓
User selects delay: 15s (5%) | 30s (12%) | 60s (20%) | 2m (30%)
        ↓
Transaction is signed via Solflare, held in local queue
        ↓
Countdown timer runs — user can cancel anytime
        ↓
On expiry, transaction is submitted with reduced priority fee
        ↓
User sees fee savings in their dashboard
```

---

## Architecture

### Frontend (React + Solflare SDK)
- **@solflare-wallet/sdk** for direct wallet integration (connect, sign, signAndSend)
- Client-side transaction queue with countdown timers
- Dashboard showing savings, history, and network impact metrics
- Built with Eitherway for rapid deployment

### Transaction Queue Logic
- Transactions are signed immediately but held in a local buffer
- On delay expiry, submitted with a lower `computeUnitPrice` (priority fee)
- The fee discount is applied by reducing the priority fee attached to the transaction
- If the user cancels during the delay, the signed transaction is simply discarded

### Fee Discount Mechanism
- Solana's priority fees are set by the sender via `ComputeBudgetProgram.setComputeUnitPrice()`
- "Wait a Minute" calculates the current median priority fee, then applies the discount tier
- Example: if median fee is 10,000 microlamports/CU, a 30s queue applies 12% off → 8,800 microlamports/CU
- The transaction still lands — just at a lower priority, which is acceptable because demand has likely dropped during the delay window

### Network Impact Estimation
- Tracks aggregate TPS relief by measuring how many transactions were deferred from peak windows
- Community leaderboard ranks users by total network contribution

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Wallet | Solflare SDK (`@solflare-wallet/sdk`) |
| Frontend | React (built via Eitherway) |
| Chain | Solana (Devnet for demo, Mainnet-ready) |
| Priority Fees | `@solana/web3.js` ComputeBudgetProgram |
| Queue | Client-side with Web Workers |
| Deployment | Eitherway app platform |

---

## Why Solflare?

- Direct SDK integration without adapter overhead
- Event-driven architecture (`connect`, `disconnect` events) fits the queue model
- `signTransaction` (sign-only) lets us hold transactions before sending — critical for the queue
- Mobile + extension + web support means Wait a Minute works everywhere Solflare does

---

## Why This Matters

1. **User incentive alignment** — Users save real money. Even 0.000005 SOL per tx adds up across thousands of daily transactions.
2. **Network public good** — Voluntary demand smoothing reduces congestion without protocol-level changes.
3. **Behavioral nudge** — Making "waiting" feel rewarding (countdown UI, savings tracker, leaderboard) turns patience into a game.
4. **Zero protocol risk** — Entirely client-side. No smart contract changes, no validator modifications, no governance needed.

---

## Competitive Landscape

| Approach | How it works | Limitation |
|----------|-------------|-----------|
| Priority fees | Users pay more to cut the line | Drives costs up for everyone |
| MEV protection (Jito) | Bundles protect ordering | Doesn't reduce demand |
| **Wait a Minute** | Users opt out of the rush | Purely additive — works alongside both |

---

## Go-to-Market

1. **SDK for dApp developers** — npm package that adds the "I Can Wait" button to any Solflare-connected dApp
2. **Standalone dashboard** — Users track savings and impact
3. **Gamification** — Seasonal leaderboards, badges, community challenges
4. **Solflare partnership** — Potential native wallet integration as a toggle in transaction settings

---

## Demo Features

- ✅ Solflare wallet connection
- ✅ Transaction queue with live countdown timers
- ✅ 4-tier delay selection (15s / 30s / 60s / 2m)
- ✅ Fee discount calculation and display
- ✅ Transaction history with savings tracking
- ✅ Network impact dashboard
- ✅ Real-time network load indicator
- ✅ Cancel-anytime queue management

---

## Team

Solo builder — Frontier Hackathon 2026 submission for the Eitherway × Solflare track.

---

## Links

- **Live Demo:** [Deployed via Eitherway]
- **Solflare Docs:** https://docs.solflare.com/solflare
- **Solflare SDK:** https://github.com/solflare-wallet/solflare-sdk
- **Frontier Hackathon:** https://colosseum.com/frontier

---

*Built with ⏳ for the Solana Frontier Hackathon 2026*
