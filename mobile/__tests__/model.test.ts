import {
  calculate,
  demoSignIn,
  demoSignUp,
  validateSlip,
  winners,
  markets,
} from '../src/model';
import { events } from '../src/data';

const picks = [
  { ...winners(events[0])[0], odds: 1.85 },
  { ...winners(events[1])[0], odds: 1.62 },
];

describe('demo account access', () => {
  it('allows sign-in with empty fields', () => {
    expect(demoSignIn('', '')).toEqual({
      authenticated: true,
      name: 'Jamie Demo',
    });
  });
  it('allows sign-up with every field empty', () => {
    expect(demoSignUp('', '', '')).toEqual({
      authenticated: true,
      name: 'Jamie Demo',
    });
  });
});

describe('fictional bet calculations', () => {
  it('provides complete player data and player markets for every live demo match',()=>{
    for(const event of events.filter(e=>e.live)){
      expect(event.players?.length).toBeGreaterThan(0);
      expect(event.statistics?.length).toBeGreaterThan(0);
      expect(event.timeline?.length).toBeGreaterThan(0);
      expect(markets(event).some(m=>/Player|goalscorer/.test(m.name))).toBe(true);
    }
  });
  it('multiplies accumulator odds and calculates estimated return and profit', () => {
    const result = calculate(picks, '10', 'accumulator');
    expect(result.totalOdds).toBeCloseTo(2.997);
    expect(result.totalStake).toBe(10);
    expect(result.estimatedReturn).toBeCloseTo(29.97);
    expect(result.profit).toBeCloseTo(19.97);
    expect(result.bonus).toBe(0);
  });
  it('calculates one stake per single and adds returns', () => {
    const result = calculate(picks, '10', 'single');
    expect(result.totalStake).toBe(20);
    expect(result.estimatedReturn).toBeCloseTo(34.7);
    expect(result.profit).toBeCloseTo(14.7);
  });
  it('recalculates after removing a selection and editing a stake', () => {
    expect(
      calculate(picks.slice(0, 1), '25', 'accumulator').estimatedReturn,
    ).toBe(46.25);
  });
  it.each(['', '-1', 'NaN', 'Infinity', '10001', '0.001'])(
    'rejects invalid stake %s',
    stake => {
      expect(
        validateSlip(picks, stake, 'accumulator', 1250, 0, 10000, false, []),
      ).toMatch(/0.01/);
    },
  );
  it('requires acceptance of changed odds', () => {
    expect(
      validateSlip(
        [{ ...picks[0], changed: true }],
        '10',
        'single',
        1250,
        0,
        100,
        false,
        [],
      ),
    ).toMatch(/accept/);
  });
  it('blocks suspended selections', () => {
    expect(
      validateSlip(picks, '10', 'accumulator', 1250, 0, 100, false, [
        picks[0].eventId,
      ]),
    ).toMatch(/suspended/);
  });
  it('respects balance, limits and session pause', () => {
    expect(validateSlip(picks, '10', 'single', 15, 0, 100, false, [])).toMatch(
      /Not enough/,
    );
    expect(
      validateSlip(picks, '10', 'single', 1250, 90, 100, false, []),
    ).toMatch(/limit/);
    expect(validateSlip(picks, '10', 'single', 1250, 0, 100, true, [])).toMatch(
      /paused/,
    );
  });
  it('accepts a valid demo slip', () => {
    expect(
      validateSlip(picks, '10', 'accumulator', 1250, 0, 100, false, []),
    ).toBe('');
  });
});
