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

export function isUpcomingMatch(status?: string): boolean {
  if (isLiveMatch(status) || isFinishedMatch(status) || isVoidMatch(status)) return false;
  return true;
}

export function livePeriodLabel(status?: string): string {
  const s = (status || '').toLowerCase().replace(/[\s_-]+/g, '');
  switch (s) {
    case '1sthalf':
    case 'firsthalf':
      return '1st half';
    case '2ndhalf':
    case 'secondhalf':
      return '2nd half';
    case 'halftime':
    case 'break':
      return 'Halftime';
    case 'extratime':
      return 'Extra time';
    case 'penalties':
    case 'shootout':
      return 'Penalties';
    default:
      return 'In play';
  }
}

export function kickoffCountdown(matchDate: string, now = Date.now()): string {
  const start = new Date(matchDate).getTime();
  if (!Number.isFinite(start)) return '';
  const diff = start - now;
  if (diff <= 0) return 'Starts now';
  if (diff < 60_000) return 'Starts in <1m';
  if (diff < 3_600_000) return `Starts in ${Math.max(1, Math.round(diff / 60_000))}m`;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.round((diff % 3_600_000) / 60_000);
  if (m > 0) return `Starts in ${h}h ${m}m`;
  return `Starts in ${h}h`;
}

export function teamWon(g: ScoreGameLike, side: 'home' | 'away'): boolean {
  if (g.result !== 'home_win' && g.result !== 'away_win') return false;
  return (side === 'home' && g.result === 'home_win') || (side === 'away' && g.result === 'away_win');
}

export type PickOutcome = 'won' | 'lost' | 'skip';

export function pickOutcome(g: {
  pick?: string;
  result?: string | null;
  matchStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
}): PickOutcome {
  if (!isFinishedMatch(g.matchStatus) || !g.result) return 'skip';
  const p = (g.pick || '').toLowerCase();

  const over = /over\s*(\d+(?:\.\d+)?)/.exec(p);
  const under = !over ? /under\s*(\d+(?:\.\d+)?)/.exec(p) : null;
  if (over || under) {
    if (g.homeScore == null || g.awayScore == null) return 'skip';
    const line = parseFloat((over || under)![1]);
    const total = Number(g.homeScore) + Number(g.awayScore);
    if (over) return total > line ? 'won' : total < line ? 'lost' : 'skip';
    return total < line ? 'won' : total > line ? 'lost' : 'skip';
  }

  if (/btts|both team/.test(p)) {
    if (g.homeScore == null || g.awayScore == null) return 'skip';
    return Number(g.homeScore) > 0 && Number(g.awayScore) > 0 ? 'won' : 'lost';
  }

  if (/double chance|draw no bet|\b1x\b|\bx2\b|\bor draw\b|\bor away\b|\bor home\b/.test(p)) {
    const homeCovered = /home|\b1\b|\b1x\b/.test(p);
    const awayCovered = /away|\b2\b|\bx2\b/.test(p);
    const drawCovered = /draw/.test(p);
    if (/draw no bet/.test(p)) {
      const homeSide = homeCovered && !awayCovered;
      const awaySide = awayCovered && !homeCovered;
      if (!homeSide && !awaySide) return 'skip';
      if (g.result === 'draw') return 'skip';
      if (homeSide) return g.result === 'home_win' ? 'won' : 'lost';
      return g.result === 'away_win' ? 'won' : 'lost';
    }
    const won =
      (homeCovered && g.result === 'home_win') ||
      (awayCovered && g.result === 'away_win') ||
      (drawCovered && g.result === 'draw');
    return won ? 'won' : 'lost';
  }

  if (p.includes('home')) return g.result === 'home_win' ? 'won' : 'lost';
  if (p.includes('away')) return g.result === 'away_win' ? 'won' : 'lost';
  if (p.includes('draw')) return g.result === 'draw' ? 'won' : 'lost';
  return 'skip';
}
