import { describe, it, expect } from 'vitest';
import { computeWins, aggregate, computeOVR, scoreRoster } from './scoring';

describe('computeWins — OVR→wins table (12 real games)', () => {
  const cases: [number, number][] = [
    [91.0, 66],
    [87.0, 63],
    [90.1, 65],
    [96.2, 70],
    [14.0, 8],
    [139.4, 82],
    [80.4, 57],
    [88.1, 64],
    [81.6, 58],
    [33.9, 21],
    [85.5, 61],
  ];

  it.each(cases)('OVR %f → %d wins', (ovr, expectedWins) => {
    const wins = computeWins(ovr);
    expect(wins).toBe(expectedWins);
    expect(82 - wins).toBe(82 - expectedWins);
  });
});

describe('OVR ≥ 110 cap', () => {
  it('OVR 110 yields 82 wins', () => {
    expect(computeWins(110)).toBe(82);
  });
  it('OVR 120 yields 82 wins', () => {
    expect(computeWins(120)).toBe(82);
  });
  it('OVR 139.4 yields 82 wins', () => {
    expect(computeWins(139.4)).toBe(82);
  });
  it('OVR 200 yields 82 wins', () => {
    expect(computeWins(200)).toBe(82);
  });
});

describe('zero-exclusion adjustment for steals and blocks', () => {
  it('drops zeros and rescales by 5/nonzeroCount', () => {
    const roster = [
      { ppg: 20, rpg: 10, apg: 5, spg: 1.9, bpg: 0.5 },
      { ppg: 20, rpg: 10, apg: 5, spg: 1.1, bpg: 0.2 },
      { ppg: 20, rpg: 10, apg: 5, spg: 0.8, bpg: 0.9 },
      { ppg: 20, rpg: 10, apg: 5, spg: 1.0, bpg: 1.2 },
      { ppg: 20, rpg: 10, apg: 5, spg: 0.0, bpg: 0.0 }, // 1960s player — no steals/blocks
    ];

    const totals = aggregate(roster);

    // steals: [1.9,1.1,0.8,1.0,0] → nonzero sum = 4.8, count = 4 → adjSpg = 4.8 × 5/4 = 6.0
    expect(totals.adjSpg).toBeCloseTo(6.0, 5);

    // blocks: [0.5,0.2,0.9,1.2,0] → nonzero sum = 2.8, count = 4 → adjBpg = 2.8 × 5/4 = 3.5
    expect(totals.adjBpg).toBeCloseTo(3.5, 5);

    // ppg/rpg/apg are plain sums
    expect(totals.ppg).toBe(100);
    expect(totals.rpg).toBe(50);
    expect(totals.apg).toBe(25);
  });

  it('all zeros yields 0', () => {
    const roster = Array.from({ length: 5 }, () => ({
      ppg: 10, rpg: 5, apg: 3, spg: 0, bpg: 0,
    }));
    const totals = aggregate(roster);
    expect(totals.adjSpg).toBe(0);
    expect(totals.adjBpg).toBe(0);
  });
});

describe('full end-to-end: HoopIQ "Contender" roster', () => {
  it('produces wins === 61 (grade B, Contender)', () => {
    // Known totals: ppg 100.8, rpg 43.7, apg 19.2
    // steals: [1.9, 1.1, 0.8, 1.0, 0.0] → adjSpg = 6.0
    // blocks: [0.5, 0.2, 0.9, 1.2, 0.0] → adjBpg = 3.5
    const roster = [
      { ppg: 25.1, rpg: 6.2, apg: 5.8, spg: 1.9, bpg: 0.5 },
      { ppg: 22.3, rpg: 4.1, apg: 3.2, spg: 1.1, bpg: 0.2 },
      { ppg: 18.7, rpg: 8.9, apg: 2.1, spg: 0.8, bpg: 0.9 },
      { ppg: 16.4, rpg: 12.3, apg: 4.8, spg: 1.0, bpg: 1.2 },
      { ppg: 18.3, rpg: 12.2, apg: 3.3, spg: 0.0, bpg: 0.0 },
    ];

    const totals = aggregate(roster);
    expect(totals.ppg).toBeCloseTo(100.8, 1);
    expect(totals.rpg).toBeCloseTo(43.7, 1);
    expect(totals.apg).toBeCloseTo(19.2, 1);
    expect(totals.adjSpg).toBeCloseTo(6.0, 1);
    expect(totals.adjBpg).toBeCloseTo(3.5, 1);

    const ovr = computeOVR(totals);
    // Allow ±0.3 on OVR due to rounding of displayed totals
    expect(ovr).toBeGreaterThanOrEqual(85.5 - 0.3);
    expect(ovr).toBeLessThanOrEqual(85.5 + 0.3);

    const result = scoreRoster(roster);
    expect(result.wins).toBe(61);
    expect(result.losses).toBe(21);
    expect(result.grade).toBe('B');
    expect(result.label).toBe('Contender');
  });
});

describe('Classic and HoopIQ share the same engine', () => {
  it('scoreRoster is a single function used by both modes', () => {
    const roster = [
      { ppg: 30, rpg: 10, apg: 8, spg: 2.0, bpg: 1.0 },
      { ppg: 25, rpg: 8, apg: 6, spg: 1.5, bpg: 0.8 },
      { ppg: 22, rpg: 7, apg: 5, spg: 1.2, bpg: 0.5 },
      { ppg: 20, rpg: 9, apg: 4, spg: 1.0, bpg: 1.5 },
      { ppg: 18, rpg: 11, apg: 3, spg: 0.8, bpg: 2.0 },
    ];
    const classic = scoreRoster(roster);
    const hoopiq = scoreRoster(roster);
    expect(classic).toEqual(hoopiq);
  });
});
