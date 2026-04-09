import {
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';

export const QUEUE_TIERS = [
  { label: '15s', seconds: 15, discount: 5 },
  { label: '30s', seconds: 30, discount: 12 },
  { label: '60s', seconds: 60, discount: 20 },
  { label: '2m', seconds: 120, discount: 30 },
];

// Default priority fee in microlamports per compute unit
const BASE_PRIORITY_FEE = 10_000;

/**
 * Build a demo SOL transfer transaction with a discounted priority fee.
 */
export function buildQueuedTransaction({
  fromPubkey,
  toPubkey,
  amountSol,
  recentBlockhash,
  tierIndex = 1,
}) {
  const tier = QUEUE_TIERS[tierIndex];
  const discountedFee = Math.floor(BASE_PRIORITY_FEE * (1 - tier.discount / 100));

  const tx = new Transaction();

  // Set compute unit price (priority fee) — this is where the discount lives
  tx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: discountedFee,
    })
  );

  // Set compute unit limit
  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200_000,
    })
  );

  // The actual transfer
  tx.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(toPubkey),
      lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
    })
  );

  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = fromPubkey;

  return {
    transaction: tx,
    baseFee: BASE_PRIORITY_FEE,
    discountedFee,
    discount: tier.discount,
    tier,
  };
}

/**
 * Calculate fee savings for display
 */
export function calculateSavings(baseFee, discountedFee, computeUnits = 200_000) {
  const baseCost = (baseFee * computeUnits) / 1e15; // microlamports → SOL
  const discountedCost = (discountedFee * computeUnits) / 1e15;
  return {
    baseCostSol: baseCost,
    discountedCostSol: discountedCost,
    savedSol: baseCost - discountedCost,
  };
}

/**
 * Create a queue entry
 */
export function createQueueEntry({
  id,
  type = 'SOL Transfer',
  from,
  to,
  amount,
  tierIndex,
  transaction = null,
}) {
  const tier = QUEUE_TIERS[tierIndex];
  const baseFee = BASE_PRIORITY_FEE;
  const discountedFee = Math.floor(baseFee * (1 - tier.discount / 100));
  const savings = calculateSavings(baseFee, discountedFee);

  return {
    id: id || Date.now().toString(),
    type,
    from,
    to,
    amount,
    tier,
    tierIndex,
    baseFee,
    discountedFee,
    savings,
    transaction,
    status: 'queued', // queued | ready | sent | cancelled
    createdAt: Date.now(),
    expiresAt: Date.now() + tier.seconds * 1000,
  };
}
