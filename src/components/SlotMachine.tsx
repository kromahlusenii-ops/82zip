import { useState, useEffect, useRef, useCallback } from 'react';
import { TEAMS, DECADES } from '../engine/types';

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------
const SPIN_DURATION_MS = 1400;    // total animation time
const TICK_MIN_MS      = 50;      // fastest swap interval
const TICK_MAX_MS      = 280;     // slowest swap interval (right before lock)

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
  /** Called when the reel animation finishes and the result is "locked." */
  onAnimationDone?: () => void;
}

type Phase = 'idle' | 'spinning';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const randomTeamCode = () => TEAMS[Math.floor(Math.random() * TEAMS.length)].code;
const randomDecade   = () => {
  const d = DECADES[Math.floor(Math.random() * DECADES.length)];
  return d.replace('s', "'s");
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
  // Which reels are currently animating
  const [animTeam, setAnimTeam] = useState(false);
  const [animEra, setAnimEra]   = useState(false);

  const rafRef   = useRef<number | null>(null);
  const startRef = useRef(0);
  const lastTickRef = useRef(0);
  const targetTeamRef = useRef('');
  const targetEraRef  = useRef('');
  const animTeamRef   = useRef(false);
  const animEraRef    = useRef(false);

  // Cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ---- Animation loop (requestAnimationFrame) ----
  const tick = useCallback((now: number) => {
    const elapsed = now - startRef.current;
    if (elapsed >= SPIN_DURATION_MS) {
      // Lock
      if (animTeamRef.current) setDisplayTeam(targetTeamRef.current);
      if (animEraRef.current)  setDisplayEra(targetEraRef.current);
      setAnimTeam(false);
      setAnimEra(false);
      animTeamRef.current = false;
      animEraRef.current  = false;
      setPhase('idle');
      rafRef.current = null;
      onAnimationDone?.();
      return;
    }

    // Ease-out: progress 0→1, interval = lerp(TICK_MIN, TICK_MAX, eased)
    const t = elapsed / SPIN_DURATION_MS;                   // linear 0→1
    const eased = 1 - Math.pow(1 - t, 3);                  // cubic ease-out
    const interval = TICK_MIN_MS + (TICK_MAX_MS - TICK_MIN_MS) * eased;

    if (now - lastTickRef.current >= interval) {
      lastTickRef.current = now;
      if (animTeamRef.current) setDisplayTeam(randomTeamCode());
      if (animEraRef.current)  setDisplayEra(randomDecade());
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onAnimationDone]);

  const startAnimation = useCallback((team: boolean, era: boolean, targetTeam: string, targetEra: string) => {
    // Cancel any running animation
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    if (prefersReducedMotion()) {
      if (team) setDisplayTeam(targetTeam);
      if (era)  setDisplayEra(targetEra);
      setPhase('idle');
      onAnimationDone?.();
      return;
    }

    targetTeamRef.current = targetTeam;
    targetEraRef.current  = targetEra;
    animTeamRef.current   = team;
    animEraRef.current    = era;
    setAnimTeam(team);
    setAnimEra(era);
    setPhase('spinning');
    startRef.current   = performance.now();
    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, onAnimationDone]);

  // ---- Watch for spin changes from game store ----
  const prevSpinRef = useRef(spin);
  useEffect(() => {
    const prev = prevSpinRef.current;
    prevSpinRef.current = spin;

    if (!spin) return;
    if (prev === spin) return; // same object, no change

    const teamChanged = !prev || prev.team.code !== spin.team.code;
    const eraChanged  = !prev || prev.decade   !== spin.decade;

    const targetTeam = spin.team.code;
    const targetEra  = spin.decade.replace('s', "'s");

    startAnimation(teamChanged, eraChanged, targetTeam, targetEra);
  }, [spin, startAnimation]);

  // Reset display when spin is cleared (new round)
  useEffect(() => {
    if (!spin && phase === 'idle') {
      setDisplayTeam('???');
      setDisplayEra('???');
    }
  }, [spin, phase]);

  // ---- Handlers ----
  const handleSpin = () => {
    if (phase === 'spinning') return;
    onSpin(); // fires game logic; spin prop will change, triggering animation via useEffect
  };

  const handleSkipTeam = () => {
    if (phase === 'spinning') return;
    onSkipTeam();
  };

  const handleSkipEra = () => {
    if (phase === 'spinning') return;
    onSkipEra();
  };

  const isSpinning = phase === 'spinning';

  return (
    <div className="space-y-3">
      {/* Reel cards */}
      <div className="flex gap-3">
        {/* TEAM reel */}
        <div className="flex-1 rounded-xl border-3 border-orange-500 bg-white p-4 text-center overflow-hidden">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Team</div>
          <div className={`text-3xl font-black text-gray-900 h-10 flex items-center justify-center transition-opacity ${animTeam ? 'opacity-80' : ''}`}>
            {displayTeam}
          </div>
          {spin && !isSpinning && (
            <div className="text-xs text-gray-500 mt-1 truncate">{spin.team.name}</div>
          )}
          {(!spin || isSpinning) && (
            <div className="text-xs text-gray-500 mt-1">&nbsp;</div>
          )}
        </div>
        {/* ERA reel */}
        <div className="flex-1 rounded-xl border-3 border-purple-500 bg-white p-4 text-center overflow-hidden">
          <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Era</div>
          <div className={`text-3xl font-black text-gray-900 h-10 flex items-center justify-center transition-opacity ${animEra ? 'opacity-80' : ''}`}>
            {displayEra}
          </div>
          <div className="text-xs text-gray-500 mt-1">Decade</div>
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
