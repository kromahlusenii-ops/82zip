export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
}

export interface TeamTotals {
  ppg: number;
  rpg: number;
  apg: number;
  adjSpg: number;
  adjBpg: number;
}

/** Per-category zero-exclusion: drop zero values, sum nonzeros, rescale to a 5-man notional total. */
function adjustCategory(values: number[]): number {
  const nonzero = values.filter(v => v > 0);
  if (nonzero.length === 0) return 0;
  const sum = nonzero.reduce((a, b) => a + b, 0);
  return sum * (5 / nonzero.length);
}

export function aggregate(roster: PlayerStats[]): TeamTotals {
  const sum = (k: keyof PlayerStats) => roster.reduce((a, p) => a + p[k], 0);
  return {
    ppg: sum('ppg'),
    rpg: sum('rpg'),
    apg: sum('apg'),
    adjSpg: adjustCategory(roster.map(p => p.spg)),
    adjBpg: adjustCategory(roster.map(p => p.bpg)),
  };
}

// Weights and "perfect team" benchmark denominators (authoritative constants).
const W = { ppg: 0.46, rpg: 0.25, apg: 0.18, spg: 0.07, bpg: 0.04 };
const DEN = { ppg: 133.4, rpg: 39.7, apg: 29.3, spg: 6.1, bpg: 3.2 };

export function computeOVR(t: TeamTotals): number {
  const raw =
    (t.ppg / DEN.ppg) * W.ppg +
    (t.rpg / DEN.rpg) * W.rpg +
    (t.apg / DEN.apg) * W.apg +
    (t.adjSpg / DEN.spg) * W.spg +
    (t.adjBpg / DEN.bpg) * W.bpg;
  return Math.round(100 * raw * 10) / 10; // one decimal place
}

export function computeWins(ovr: number): number {
  return Math.round(82 * Math.pow(Math.min(ovr / 110, 1), 1.15)); // convex curve, cap at OVR 110
}

export function gradeFor(wins: number): { grade: string; label: string } {
  if (wins >= 80) return { grade: 'S', label: 'Perfect' };
  if (wins >= 72) return { grade: 'A+', label: 'Historic' };
  if (wins >= 62) return { grade: 'A', label: 'Dynasty' };
  if (wins >= 57) return { grade: 'B', label: 'Contender' };
  if (wins >= 50) return { grade: 'C', label: 'Playoff' };
  if (wins >= 40) return { grade: 'D', label: 'Lottery' };
  return { grade: 'F', label: 'Tanking' };
}

export function scoreRoster(roster: PlayerStats[]) {
  const totals = aggregate(roster);
  const ovr = computeOVR(totals);
  const wins = computeWins(ovr);
  const losses = 82 - wins;
  return { totals, ovr, wins, losses, ...gradeFor(wins) };
}
