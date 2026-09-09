import { Match, events } from './data';

export type Selection = {
  id: string;
  marketId?: string;
  suspended?: boolean;
  eventId: string;
  market: string;
  label: string;
  odds: number;
  previous?: number;
  changed?: boolean;
};
export type BetMode = 'single' | 'accumulator';
export const matchById = (id: string) =>
  events.find(e => e.id === id) || events[0];
export const credits = (n: number) =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function winners(e: Match): Selection[] {
  if (e.markets) return e.markets[0]?.options || [];
  return e.odds.map((odds, i) => ({
    id: `${e.id}-winner-${i}`,
    eventId: e.id,
    market: 'Match winner',
    label: e.odds.length === 3 ? [e.a, 'Draw', e.b][i] : [e.a, e.b][i],
    odds,
  }));
}
export function markets(e: Match) {
  if (e.markets) return e.markets;
  const football = e.sport === 'football';
  const rows: { name: string; labels: string[]; odds: number[] }[] = football
    ? [
        {
          name: 'Double chance',
          labels: ['Home or draw', 'Away or draw', 'Home or away'],
          odds: [1.21, 1.98, 1.28],
        },
        {
          name: 'Total goals',
          labels: ['Over 2.5', 'Under 2.5'],
          odds: [1.57, 2.36],
        },
        {
          name: 'Both teams to score',
          labels: ['Yes', 'No'],
          odds: [1.64, 2.2],
        },
        { name: 'Handicap', labels: ['Home −1', 'Away +1'], odds: [2.1, 1.74] },
        {
          name: 'Next scorer',
          labels: [e.a, e.b, 'No more goals'],
          odds: [1.9, 2.8, 4.3],
        },
        {
          name: 'Correct score',
          labels: ['2–1', '3–1', '2–2'],
          odds: [4.4, 5.5, 6.1],
        },
        {
          name: 'Player shots',
          labels: ['J. Vale · Over 1.5', 'J. Vale · Under 1.5'],
          odds: [1.88, 1.94],
        },
        {
          name: 'Custom combination',
          labels: ['Home + over 2.5', 'Away + both score'],
          odds: [2.8, 5.2],
        },
      ]
    : [
        {
          name: 'Total points',
          labels: [
            e.sport === 'cricket'
              ? 'Over 165.5'
              : e.sport === 'tennis'
              ? 'Over 23.5'
              : 'Over 180.5',
            e.sport === 'cricket'
              ? 'Under 165.5'
              : e.sport === 'tennis'
              ? 'Under 23.5'
              : 'Under 180.5',
          ],
          odds: [1.88, 1.92],
        },
        {
          name: 'Handicap',
          labels: ['Home −2.5', 'Away +2.5'],
          odds: [1.95, 1.85],
        },
        {
          name: 'Player performance',
          labels: ['First player · Over 20.5', 'First player · Under 20.5'],
          odds: [2.1, 1.74],
        },
        {
          name: 'Custom combination',
          labels: ['Home + total over', 'Away + total under'],
          odds: [3.2, 3.6],
        },
      ];
  return [
    { name: 'Match winner', options: winners(e) },
    ...rows.map((r, j) => ({
      name: r.name,
      options: r.labels.map((label, i) => ({
        id: `${e.id}-market-${j}-${i}`,
        eventId: e.id,
        market: r.name,
        label,
        odds: r.odds[i],
      })),
    })),
    ...(e.playerMarkets || []),
  ];
}
export function calculate(
  selections: Selection[],
  stakeText: string,
  mode: BetMode,
) {
  const raw = Number(stakeText),
    stake = Number.isFinite(raw) && raw >= 0 && raw <= 10000 ? raw : 0;
  const totalOdds = selections.reduce((a, s) => a * s.odds, 1);
  const totalStake = mode === 'single' ? stake * selections.length : stake;
  const estimatedReturn = selections.length
    ? stake *
      (mode === 'single'
        ? selections.reduce((a, s) => a + s.odds, 0)
        : totalOdds)
    : 0;
  return {
    stake,
    totalStake,
    totalOdds,
    estimatedReturn,
    profit: estimatedReturn - totalStake,
    bonus: 0,
  };
}
export function validateSlip(
  selections: Selection[],
  stake: string,
  mode: BetMode,
  balance: number,
  spent: number,
  limit: number,
  paused: boolean,
  suspended: string[],
) {
  const t = calculate(selections, stake, mode);
  if (!selections.length) return 'Add a selection to continue.';
  if (paused) return 'Demo play is paused for this session.';
  if (selections.some(s => suspended.includes(s.eventId)))
    return 'A selected market is suspended. Remove it to continue.';
  if (selections.some(s => s.changed))
    return 'Review and accept the updated odds.';
  if (
    t.stake < 0.01 ||
    Math.abs(t.stake * 100 - Math.round(t.stake * 100)) > 0.00001
  )
    return 'Use 0.01–10,000 credits, with up to two decimal places.';
  if (t.totalStake > balance)
    return 'Not enough demo credits. Try a smaller stake.';
  if (t.totalStake + spent > limit)
    return 'This exceeds your session spending limit.';
  return '';
}
// Authentication is deliberately local and permissive. All fields are optional;
// typed values are never sent, persisted, or used as real credentials.
export function demoSignIn(_email = '', _password = '') {
  return { authenticated: true, name: 'Jamie Demo' };
}
export function demoSignUp(_name = '', _email = '', _password = '') {
  return { authenticated: true, name: 'Jamie Demo' };
}
export const community = [
  {
    name: 'Matchday Muse',
    initials: 'MM',
    form: 'WWLWW',
    rate: '64%',
    stake: 20,
    posted: 7.11,
    minutes: 8,
    eventIds: ['e1', 'e2', 'e7'],
  },
  {
    name: 'Court Observer',
    initials: 'CO',
    form: 'WLWLW',
    rate: '57%',
    stake: 15,
    posted: 3.21,
    minutes: 16,
    eventIds: ['e3', 'e4'],
  },
  {
    name: 'Quiet Playbook',
    initials: 'QP',
    form: 'LWWWL',
    rate: '61%',
    stake: 10,
    posted: 6.69,
    minutes: 32,
    eventIds: ['e6', 'e8', 'e10'],
  },
];
export const games = [
  {
    id: 'dice',
    name: 'Neon Dice',
    icon: 'dice',
    description: 'A little roll. A new possibility.',
    rules:
      'Roll a six-sided die. 4, 5 or 6 returns 1.8× your stake. 1, 2 or 3 returns zero.',
  },
  {
    id: 'cards',
    name: 'Lucky Cards',
    icon: 'cards',
    description: 'Turn the card. Find your moment.',
    rules: 'Draw one of 13 ranks. 8–K returns 2× your stake. A–7 returns zero.',
  },
  {
    id: 'rocket',
    name: 'Rocket Rise',
    icon: 'rocket',
    description: 'How high will your next flight go?',
    rules:
      'Five equally likely outcomes: 1×, 1.2×, 1.5×, 2×, 3×. A 1× flight loses the stake; other flights return stake × multiplier.',
  },
];
