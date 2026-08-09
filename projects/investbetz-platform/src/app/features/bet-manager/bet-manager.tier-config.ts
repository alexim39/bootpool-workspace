export interface BetManagerTierInfo {
  key: string;
  label: string;
  icon: string;
  minDeposit: number;
  color: string;
  strategy: string;
  allocation: string;
  guaranteedMinPct: number;
  maxReturnPct: number;
}

export const BET_MANAGER_TIERS: BetManagerTierInfo[] = [
  {
    key: 'academy',
    label: 'Academy',
    icon: '🏫',
    minDeposit: 10_000,
    color: '#B0BEC5',
    strategy: 'Growth starter — lowest entry, learn the ropes, minimal risk',
    allocation: 'Ultra-low-risk Pods (1.0x–1.3x)',
    guaranteedMinPct: 1,
    maxReturnPct: 10,
  },
  {
    key: 'goalkeeper',
    label: 'Goalkeeper',
    icon: '🧤',
    minDeposit: 20_000,
    color: '#90CAF9',
    strategy: 'Starter — low entry, steady returns, minimal risk',
    allocation: 'Low-risk Pods (1.1x–1.5x)',
    guaranteedMinPct: 1,
    maxReturnPct: 10,
  },
  {
    key: 'defender',
    label: 'Defender',
    icon: '🛡️',
    minDeposit: 50_000,
    color: '#00E676',
    strategy: 'Conservative — low-risk Pods, high refund confidence',
    allocation: 'Mostly Pods (1.2x–1.8x)',
    guaranteedMinPct: 1,
    maxReturnPct: 10,
  },
  {
    key: 'midfielder',
    label: 'Midfielder',
    icon: '⚡',
    minDeposit: 100_000,
    color: '#E8B923',
    strategy: 'Balanced — mix of Pods and Match Pools',
    allocation: 'Pods + Match Pools (1.5x–2.5x)',
    guaranteedMinPct: 1,
    maxReturnPct: 10,
  },
  {
    key: 'striker',
    label: 'Striker',
    icon: '🎯',
    minDeposit: 200_000,
    color: '#FF5252',
    strategy: 'Aggressive — higher multipliers, more Match Pools',
    allocation: 'High-multiplier Pods (2x–5x)',
    guaranteedMinPct: 1,
    maxReturnPct: 10,
  },
  {
    key: 'chairman',
    label: 'Chairman',
    icon: '🏛️',
    minDeposit: 500_000,
    color: '#FFD700',
    strategy: 'Ownership tier — highest multipliers, premium Match Pools exposure',
    allocation: 'Elite Pods + Match Pools (2.5x–6x)',
    guaranteedMinPct: 1,
    maxReturnPct: 10,
  },
];

export function betManagerTierInfo(key: string): BetManagerTierInfo {
  return BET_MANAGER_TIERS.find(t => t.key === key)!;
}
