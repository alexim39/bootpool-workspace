import { pickOutcome, matchStatusLabel, livePeriodLabel, kickoffCountdown } from './game-status.util';

describe('game-status.util', () => {
  const finished = { matchStatus: 'finished', result: 'draw' as const, homeScore: 0, awayScore: 0 };

  describe('pickOutcome — over/under', () => {
    it('marks Under 2.5 as won on a 0-0 draw', () => {
      expect(pickOutcome({ ...finished, pick: 'Under 2.5', result: 'draw' })).toBe('won');
    });

    it('marks Under 2.50 as won on a 0-0 draw (decimal line)', () => {
      expect(pickOutcome({ ...finished, pick: 'Under 2.50', result: 'draw' })).toBe('won');
    });

    it('marks Under 2.5 as lost when 3+ goals are scored', () => {
      expect(pickOutcome({ ...finished, pick: 'Under 2.5', result: 'away_win', homeScore: 1, awayScore: 2 })).toBe('lost');
    });

    it('marks Over 1.5 as won when 2+ goals are scored', () => {
      expect(pickOutcome({ ...finished, pick: 'Over 1.5', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('won');
    });

    it('marks Over 2.5 as lost when only 2 goals are scored', () => {
      expect(pickOutcome({ ...finished, pick: 'Over 2.5', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('lost');
    });

    it('skips on a push (total equals the line)', () => {
      expect(pickOutcome({ ...finished, pick: 'Over 2', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('skip');
    });

    it('skips when scores are unavailable', () => {
      expect(pickOutcome({ ...finished, pick: 'Under 2.5', homeScore: null, awayScore: null })).toBe('skip');
    });
  });

  describe('pickOutcome — BTTS', () => {
    it('marks BTTS as won when both teams score', () => {
      expect(pickOutcome({ ...finished, pick: 'BTTS', result: 'draw', homeScore: 1, awayScore: 1 })).toBe('won');
    });

    it('marks BTTS as lost when only one team scores', () => {
      expect(pickOutcome({ ...finished, pick: 'BTTS Yes', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('lost');
    });
  });

  describe('pickOutcome — 1X2 and double chance', () => {
    it('marks a home pick as won on a home win', () => {
      expect(pickOutcome({ ...finished, pick: 'Home', result: 'home_win', homeScore: 2, awayScore: 1 })).toBe('won');
    });

    it('marks a home pick as lost on an away win', () => {
      expect(pickOutcome({ ...finished, pick: 'Home', result: 'away_win', homeScore: 1, awayScore: 2 })).toBe('lost');
    });

    it('marks a draw pick as won on a draw', () => {
      expect(pickOutcome({ ...finished, pick: 'Draw', result: 'draw' })).toBe('won');
    });

    it('marks Home or Draw as won on a draw', () => {
      expect(pickOutcome({ ...finished, pick: 'Home or Draw', result: 'draw' })).toBe('won');
    });

    it('marks Home or Draw as lost on an away win', () => {
      expect(pickOutcome({ ...finished, pick: 'Home or Draw', result: 'away_win', homeScore: 0, awayScore: 1 })).toBe('lost');
    });

    it('marks Away or Draw as won on a draw or away win', () => {
      expect(pickOutcome({ ...finished, pick: 'Away or Draw', result: 'draw' })).toBe('won');
      expect(pickOutcome({ ...finished, pick: 'Away or Draw', result: 'away_win', homeScore: 1, awayScore: 2 })).toBe('won');
    });

    it('marks Away or Draw as lost on a home win', () => {
      expect(pickOutcome({ ...finished, pick: 'Away or Draw', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('lost');
    });

    it('marks Home or Away as won when either side wins', () => {
      expect(pickOutcome({ ...finished, pick: 'Home or Away', result: 'home_win', homeScore: 1, awayScore: 0 })).toBe('won');
      expect(pickOutcome({ ...finished, pick: 'Home or Away', result: 'away_win', homeScore: 0, awayScore: 1 })).toBe('won');
    });

    it('marks Home or Away as lost on a draw', () => {
      expect(pickOutcome({ ...finished, pick: 'Home or Away', result: 'draw', homeScore: 1, awayScore: 1 })).toBe('lost');
    });

    it('skips Draw No Bet on a draw (refund)', () => {
      expect(pickOutcome({ ...finished, pick: 'Home Draw No Bet', result: 'draw' })).toBe('skip');
    });
  });

  describe('pickOutcome — guards', () => {
    it('skips non-finished matches', () => {
      expect(pickOutcome({ pick: 'Under 2.5', matchStatus: 'notstarted', result: null })).toBe('skip');
    });

    it('skips picks that cannot be judged', () => {
      expect(pickOutcome({ ...finished, pick: 'Arsenal to win the tournament' })).toBe('skip');
    });
  });

  describe('pickOutcome — combined parlay picks', () => {
    it('wins only when every leg wins', () => {
      expect(pickOutcome({ ...finished, pick: 'Home Win + Over 2.5', result: 'home_win', homeScore: 2, awayScore: 1 })).toBe('won');
    });

    it('loses when any leg loses', () => {
      expect(pickOutcome({ ...finished, pick: 'Home Win + Over 2.5', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('lost');
    });

    it('skips when any leg pushes', () => {
      expect(pickOutcome({ ...finished, pick: 'Home Win + Over 2', result: 'home_win', homeScore: 2, awayScore: 0 })).toBe('skip');
    });
  });

  describe('labels', () => {
    it('labels live phases', () => {
      expect(livePeriodLabel('2nd_half')).toBe('2nd half');
      expect(livePeriodLabel('halftime')).toBe('Halftime');
    });

    it('labels match status', () => {
      expect(matchStatusLabel('finished')).toBe('FT');
      expect(matchStatusLabel('notstarted')).toBe('Upcoming');
    });
  });

  describe('kickoffCountdown', () => {
    const now = Date.now();

    it('formats hour/minute countdowns', () => {
      expect(kickoffCountdown(new Date(now + 2 * 3600000 + 5 * 60000).toISOString(), now)).toBe('Starts in 2h 5m');
    });

    it('formats minute-only countdowns', () => {
      expect(kickoffCountdown(new Date(now + 45 * 60000).toISOString(), now)).toBe('Starts in 45m');
    });

    it('returns an empty string far in the future (48h+)', () => {
      expect(kickoffCountdown(new Date(now + 48 * 3600000).toISOString(), now)).toBe('');
      expect(kickoffCountdown(new Date(now + 49 * 3600000).toISOString(), now)).toBe('');
    });

    it('still counts down just under the 48h cutoff', () => {
      expect(kickoffCountdown(new Date(now + 47 * 3600000 + 59 * 60000).toISOString(), now)).toBe('Starts in 47h 59m');
    });
  });
});
