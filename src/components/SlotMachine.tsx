import { useState, useEffect, useRef, useCallback } from 'react';
import { TEAMS, DECADES } from '../engine/types';

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------
const SPIN_DURATION_MS = 1400;
const TICK_MIN_MS      = 40;      // fastest swap interval
const TICK_MAX_MS      = 240;     // slowest swap interval (right before lock)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Props {
  spin: { team: { code: string; name: string }; decade: string } | null;
  onSpin: () => void;
  onSkipTeam: () => void;
  onSkipEra: () => void;
  disabled: boolean;
  canSkipTeam: boolean;
  canSkipEra: boolean;
  onAnimationDone?: () => void;
}

type Phase = 'idle' | 'spinning';

// ---------------------------------------------------------------------------
// Helpers — pure functions, no React state
// ---------------------------------------------------------------------------
const randomTeamCode = () => TEAMS[Math.floor(Math.random() * TEAMS.length)].code;
const randomDecade   = () => {
  const d = DECADES[Math.floor(Math.random() * DECADES.length)];
  return d.replace('s', "'s");
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SlotMachine({
  spin, onSpin, onSkipTeam, onSkipEra,
  disabled, canSkipTeam, canSkipEra, onAnimationDone,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayTeam, setDisplayTeam] = useState('???');
  const [displayEra, setDisplayEra]   = useState('???');

  // Refs for the RAF loop — avoid stale closures
  const rafRef        = useRef<number | null>(null);
  const startRef      = useRef(0);
  const lastTickRef   = useRef(0);
  const targetTeamRef = useRef('');
  const targetEraRef  = useRef('');
  const animTeamRef   = useRef(false);
  const animEraRef    = useRef(false);
  const doneRef       = useRef<(() => void) | undefined>(undefined);

  // Keep doneRef in sync so the RAF callback sees the latest onAnimationDone
  useEffect(() => { doneRef.current = onAnimationDone; }, [onAnimationDone]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- RAF loop ----
  const tick = useCallback((now: number) => {
    const elapsed = now - startRef.current;
    const progress = clamp(elapsed / SPIN_DURATION_MS, 0, 1);

    if (progress >= 1) {
      // Lock: snap to committed values
      if (animTeamRef.current) setDisplayTeam(targetTeamRef.current);
      if (animEraRef.current)  setDisplayEra(targetEraRef.current);
      animTeamRef.current = false;
      animEraRef.current  = false;
      setPhase('idle');
      rafRef.current = null;
      doneRef.current?.();
      return;
    }

    // Ease-out cubic: fast at start, decelerates toward end
    const eased    = 1 - Math.pow(1 - progress, 3);
    const interval = lerp(TICK_MIN_MS, TICK_MAX_MS, eased);

    // Only swap when enough time has passed since the last tick
    if (now - lastTickRef.current >= interval) {
      lastTickRef.current = now;
      if (animTeamRef.current) setDisplayTeam(randomTeamCode());
      if (animEraRef.current)  setDisplayEra(randomDecade());
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);  // stable — reads everything from refs

  const startAnimation = useCallback((team: boolean, era: boolean, targetTeam: string, targetEra: string) => {
    // Cancel any in-flight animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Reduced motion: instant reveal
    if (prefersReducedMotion()) {
      if (team) setDisplayTeam(targetTeam);
      if (era)  setDisplayEra(targetEra);
      setPhase('idle');
      doneRef.current?.();
      return;
    }

    targetTeamRef.current = targetTeam;
    targetEraRef.current  = targetEra;
    animTeamRef.current   = team;
    animEraRef.current    = era;
    setPhase('spinning');

    const now = performance.now();
    startRef.current    = now;
    lastTickRef.current = now;  // FIX: seed to now, not 0
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // ---- Watch for spin prop changes from game store ----
  const prevSpinRef = useRef(spin);
  useEffect(() => {
    const prev = prevSpinRef.current;
    prevSpinRef.current = spin;

    if (!spin) return;
    if (prev === spin) return;

    const teamChanged = !prev || prev.team.code !== spin.team.code;
    const eraChanged  = !prev || prev.decade   !== spin.decade;

    startAnimation(
      teamChanged, eraChanged,
      spin.team.code,
      spin.decade.replace('s', "'s"),
    );
  }, [spin, startAnimation]);

  // Reset display when spin clears (new round)
  useEffect(() => {
    if (!spin && phase === 'idle') {
      setDisplayTeam('???');
      setDisplayEra('???');
    }
  }, [spin, phase]);

  // ---- Handlers ----
  const handleSpin     = () => { if (phase !== 'spinning') onSpin(); };
  const handleSkipTeam = () => { if (phase !== 'spinning') onSkipTeam(); };
  const handleSkipEra  = () => { if (phase !== 'spinning') onSkipEra(); };

  const isSpinning = phase === 'spinning';

  return (
    <div className="space-y-3">
      {/* Reel cards */}
      <div className="flex gap-3">
        {/* TEAM reel */}
        <div className="flex-1 rounded-xl border-3 border-orange-500 bg-white p-4 text-center overflow-hidden">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Team</div>
          <div className="text-3xl font-black text-gray-900 h-10 flex items-center justify-center">
            {displayTeam}
          </div>
          <div className="text-xs text-gray-500 mt-1 h-4 truncate">
            {spin && !isSpinning ? spin.team.name : '\u00A0'}
          </div>
        </div>
        {/* ERA reel */}
        <div className="flex-1 rounded-xl border-3 border-purple-500 bg-white p-4 text-center overflow-hidden">
          <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Era</div>
          <div className="text-3xl font-black text-gray-900 h-10 flex items-center justify-center">
            {displayEra}
          </div>
          <div className="text-xs text-gray-500 mt-1 h-4">Decade</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center justify-center">
        <button
          onClick={handleSpin}
          disabled={disabled || isSpinning}
          className="px-8 py-2.5 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm min-w-[120px]"
        >
          {isSpinning ? 'SPINNING…' : 'SPIN'}
        </button>
        <button
          onClick={handleSkipTeam}
          disabled={!canSkipTeam || isSpinning}
          className="px-3 py-2 text-orange-500 text-xs font-semibold hover:bg-orange-50 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Team
        </button>
        <button
          onClick={handleSkipEra}
          disabled={!canSkipEra || isSpinning}
          className="px-3 py-2 text-purple-500 text-xs font-semibold hover:bg-purple-50 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Era
        </button>
      </div>
    </div>
  );
}
