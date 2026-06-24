import { create } from 'zustand';
import type { Player, Pos, GameMode, PlacedPlayer } from '../engine/types';
import { TEAMS } from '../engine/types';
import { players } from '../data/players';
import { mulberry32, pick } from '../engine/rng';
import { scoreRoster } from '../engine/scoring';
import type { TeamTotals } from '../engine/scoring';

// --- Combo index: precomputed at import time ---

const COMBO_INDEX = new Map<string, Player[]>();
for (const p of players) {
  const key = `${p.team}|${p.decade}`;
  const arr = COMBO_INDEX.get(key);
  if (arr) arr.push(p);
  else COMBO_INDEX.set(key, [p]);
}

const TEAM_MAP = new Map(TEAMS.map(t => [t.code, t]));

const ALL_VALID_COMBOS: { team: { code: string; name: string }; decade: string }[] = [];
for (const [key] of COMBO_INDEX) {
  const [code, decade] = key.split('|');
  const team = TEAM_MAP.get(code)!;
  ALL_VALID_COMBOS.push({ team, decade });
}

function filterPool(teamCode: string, decade: string): Player[] {
  return COMBO_INDEX.get(`${teamCode}|${decade}`) || [];
}

function getEligibleCombos(filledSlots: Set<Pos>) {
  return ALL_VALID_COMBOS.filter(({ team, decade }) => {
    const pool = COMBO_INDEX.get(`${team.code}|${decade}`) || [];
    return pool.some(p => p.positions.some(pos => !filledSlots.has(pos)));
  });
}

// --- Selectors for skip button disabling ---

export function selectCanSkipTeam(state: GameState): boolean {
  if (state.teamSkipsLeft <= 0 || !state.spin) return false;
  const candidates = getEligibleCombos(state.filledSlots).filter(
    c => c.decade === state.spin!.decade && c.team.code !== state.spin!.team.code
  );
  return candidates.length > 0;
}

export function selectCanSkipEra(state: GameState): boolean {
  if (state.eraSkipsLeft <= 0 || !state.spin) return false;
  const candidates = getEligibleCombos(state.filledSlots).filter(
    c => c.team.code === state.spin!.team.code && c.decade !== state.spin!.decade
  );
  return candidates.length > 0;
}

// --- Store ---

interface SpinResult {
  team: { code: string; name: string };
  decade: string;
  pool: Player[];
}

interface GameResult {
  totals: TeamTotals;
  ovr: number;
  wins: number;
  losses: number;
  grade: string;
  label: string;
}

interface GameState {
  mode: GameMode | null;
  round: number;
  placed: PlacedPlayer[];
  filledSlots: Set<Pos>;
  spin: SpinResult | null;
  selectedPlayer: Player | null;
  teamSkipsLeft: number;
  eraSkipsLeft: number;
  result: GameResult | null;
  rng: (() => number) | null;
  seed: number;

  startGame: (mode: GameMode, seed?: number) => void;
  doSpin: () => void;
  skipTeam: () => void;
  skipEra: () => void;
  selectPlayer: (player: Player) => void;
  placePlayer: (slot: Pos) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: null,
  round: 1,
  placed: [],
  filledSlots: new Set(),
  spin: null,
  selectedPlayer: null,
  teamSkipsLeft: 1,
  eraSkipsLeft: 1,
  result: null,
  rng: null,
  seed: 0,

  startGame: (mode, seed) => {
    const s = seed ?? Date.now();
    const rng = mulberry32(s);
    set({
      mode,
      round: 1,
      placed: [],
      filledSlots: new Set(),
      spin: null,
      selectedPlayer: null,
      teamSkipsLeft: 1,
      eraSkipsLeft: 1,
      result: null,
      rng,
      seed: s,
    });
  },

  doSpin: () => {
    const { rng, filledSlots } = get();
    if (!rng) return;
    const eligible = getEligibleCombos(filledSlots);
    if (eligible.length === 0) return;
    const combo = pick(eligible, rng);
    const pool = filterPool(combo.team.code, combo.decade);
    set({ spin: { team: combo.team, decade: combo.decade, pool }, selectedPlayer: null });
  },

  skipTeam: () => {
    const { rng, teamSkipsLeft, spin, filledSlots } = get();
    if (!rng || teamSkipsLeft <= 0 || !spin) return;
    const candidates = getEligibleCombos(filledSlots).filter(
      c => c.decade === spin.decade && c.team.code !== spin.team.code
    );
    if (candidates.length === 0) return;
    const combo = pick(candidates, rng);
    const pool = filterPool(combo.team.code, combo.decade);
    set({
      spin: { team: combo.team, decade: combo.decade, pool },
      teamSkipsLeft: teamSkipsLeft - 1,
      selectedPlayer: null,
    });
  },

  skipEra: () => {
    const { rng, eraSkipsLeft, spin, filledSlots } = get();
    if (!rng || eraSkipsLeft <= 0 || !spin) return;
    const candidates = getEligibleCombos(filledSlots).filter(
      c => c.team.code === spin.team.code && c.decade !== spin.decade
    );
    if (candidates.length === 0) return;
    const combo = pick(candidates, rng);
    const pool = filterPool(combo.team.code, combo.decade);
    set({
      spin: { team: combo.team, decade: combo.decade, pool },
      eraSkipsLeft: eraSkipsLeft - 1,
      selectedPlayer: null,
    });
  },

  selectPlayer: (player) => set({ selectedPlayer: player }),

  placePlayer: (slot) => {
    const { selectedPlayer, placed, filledSlots, round } = get();
    if (!selectedPlayer || filledSlots.has(slot)) return;
    if (!selectedPlayer.positions.includes(slot)) return;

    const newPlaced = [...placed, { player: selectedPlayer, slot }];
    const newFilled = new Set(filledSlots);
    newFilled.add(slot);

    if (newPlaced.length === 5) {
      const rosterStats = newPlaced.map(p => p.player.stats);
      const res = scoreRoster(rosterStats);
      set({
        placed: newPlaced,
        filledSlots: newFilled,
        selectedPlayer: null,
        spin: null,
        round: 6,
        result: res,
      });
    } else {
      set({
        placed: newPlaced,
        filledSlots: newFilled,
        selectedPlayer: null,
        spin: null,
        round: round + 1,
      });
    }
  },

  reset: () =>
    set({
      mode: null,
      round: 1,
      placed: [],
      filledSlots: new Set(),
      spin: null,
      selectedPlayer: null,
      teamSkipsLeft: 1,
      eraSkipsLeft: 1,
      result: null,
      rng: null,
      seed: 0,
    }),
}));
