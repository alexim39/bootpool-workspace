export interface ScoreGameLike {
  matchStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  result?: 'home_win' | 'draw' | 'away_win' | string | null;
}

const LIVE_STATUSES = ['inprogress', 'live', '1st_half', '2nd_half', 'halftime', 'extra_time', 'penalties', 'shootout', 'break'];
const VOID_STATUSES = ['postponed', 'cancelled', 'abandoned'];

export function isLiveMatch(status?: string): boolean {
  return !!status && LIVE_STATUSES.includes(status.toLowerCase());
}

export function isFinishedMatch(status?: string): boolean {
  return status?.toLowerCase() === 'finished';
}

export function isVoidMatch(status?: string): boolean {
  return !!status && VOID_STATUSES.includes(status.toLowerCase());
}

export function hasScore(g: ScoreGameLike): boolean {
  return (isFinishedMatch(g.matchStatus) || isLiveMatch(g.matchStatus)) &&
    g.homeScore != null && g.awayScore != null;
}

export function scoreText(g: ScoreGameLike): string {
  if (!hasScore(g)) return '';
  return `${g.homeScore} – ${g.awayScore}`;
}

export function matchStatusLabel(status?: string): string {
  if (isFinishedMatch(status)) return 'FT';
  if (isLiveMatch(status)) return 'Live';
  if (isVoidMatch(status)) return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (!status || status === 'notstarted' || status === 'scheduled') return 'Upcoming';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function matchStatusClass(status?: string): string {
  if (isFinishedMatch(status)) return 'finished';
  if (isLiveMatch(status)) return 'live';
  if (isVoidMatch(status)) return 'void';
  return 'upcoming';
}

export function resultLabel(result?: string | null): string {
  if (result === 'home_win') return 'Home Win';
  if (result === 'away_win') return 'Away Win';
  if (result === 'draw') return 'Draw';
  return '';
}

export function teamWon(g: ScoreGameLike, side: 'home' | 'away'): boolean {
  if (g.result !== 'home_win' && g.result !== 'away_win') return false;
  return (side === 'home' && g.result === 'home_win') || (side === 'away' && g.result === 'away_win');
}

export type PickOutcome = 'won' | 'lost' | 'skip';

export function pickOutcome(g: { pick?: string; result?: string | null; matchStatus?: string }): PickOutcome {
  if (!isFinishedMatch(g.matchStatus) || !g.result) return 'skip';
  const p = (g.pick || '').toLowerCase();
  if (/over\s?\d/.test(p) || /under\s?\d/.test(p) || /btts|both team|double chance|draw no bet/.test(p)) return 'skip';
  if (p.includes('home')) return g.result === 'home_win' ? 'won' : 'lost';
  if (p.includes('away')) return g.result === 'away_win' ? 'won' : 'lost';
  if (p.includes('draw')) return g.result === 'draw' ? 'won' : 'lost';
  return 'skip';
}
