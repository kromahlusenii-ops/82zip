import { useState, useEffect, useRef, useCallback } from 'react';
import { TEAMS, DECADES } from '../engine/types';

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------
const SPIN_DURATION_MS = 1400;
const TICK_MIN_MS      = 16;      // every frame (~60fps) at peak speed
const TICK_MAX_MS      = 100;     // still rapid near the end

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TEAM_CODES = TEAMS.map(t => t.code);
const DECADE_LABELS = (DECADES as readonly string[]).map(d => d.replace('s', "'s"));

const randFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Component
//
// Key design: during the spin animation we write text directly to DOM refs
// instead of calling setState on every tick. This avoids ~35 React re-renders
// per spin and eliminates the jitter caused by React's reconciliation batching.
// React state is only set at start (phase → spinning) and at lock (phase → idle).
// ---------------------------------------------------------------------------
export function SlotMachine({
  spin, onSpin, onSkipTeam, onSkipEra,
  disabled, canSkipTeam, canSkipEra, onAnimationDone,
}: Props) {
  const [phase, setPhase] = useState<'idle' | 'spinning'>('idle');

  // DOM refs for direct text manipulation during spin
  const teamTextRef = useRef<HTMLDivElement>(null);
  const eraTextRef  = useRef<HTMLDivElement>(null);
  const teamNameRef = useRef<HTMLDivElement>(null);

  // Animation state (all in refs, no React re-renders during spin)
  const rafRef        = useRef<number | null>(null);
  const startRef      = useRef(0);
  const lastTickRef   = useRef(0);
  const targetTeamRef = useRef('');
  const targetEraRef  = useRef('');
  const animTeamRef   = useRef(false);
  const animEraRef    = useRef(false);
  const doneRef       = useRef<(() => void) | undefined>(undefined);
  const spinRef       = useRef(spin);

  useEffect(() => { doneRef.current = onAnimationDone; }, [onAnimationDone]);
  useEffect(() => { spinRef.current = spin; }, [spin]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- Direct-DOM text writers (no React setState) ----
  const writeTeam = (text: string) => {
    if (teamTextRef.current) teamTextRef.current.textContent = text;
  };
  const writeEra = (text: string) => {
    if (eraTextRef.current) eraTextRef.current.textContent = text;
  };
  const writeTeamName = (text: string) => {
    if (teamNameRef.current) teamNameRef.current.textContent = text;
  };

  // ---- RAF loop — zero React renders, pure DOM writes ----
  const tick = useCallback((now: number) => {
    const elapsed  = now - startRef.current;
    const progress = Math.min(elapsed / SPIN_DURATION_MS, 1);

    if (progress >= 1) {
      // Lock: snap to final values
      if (animTeamRef.current) writeTeam(targetTeamRef.current);
      if (animEraRef.current)  writeEra(targetEraRef.current);
      animTeamRef.current = false;
      animEraRef.current  = false;
      rafRef.current = null;
      // Show team name after lock
      const s = spinRef.current;
      writeTeamName(s ? s.team.name : '\u00A0');
      // Single React state update at end
      setPhase('idle');
      doneRef.current?.();
      return;
    }

    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const interval = TICK_MIN_MS + (TICK_MAX_MS - TICK_MIN_MS) * eased;

    if (now - lastTickRef.current >= interval) {
      lastTickRef.current = now;
      if (animTeamRef.current) writeTeam(randFrom(TEAM_CODES));
      if (animEraRef.current)  writeEra(randFrom(DECADE_LABELS));
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startAnimation = useCallback((team: boolean, era: boolean, targetTeam: string, targetEra: string) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (prefersReducedMotion()) {
      if (team) writeTeam(targetTeam);
      if (era)  writeEra(targetEra);
      const s = spinRef.current;
      writeTeamName(s ? s.team.name : '\u00A0');
      setPhase('idle');
      doneRef.current?.();
      return;
    }

    targetTeamRef.current = targetTeam;
    targetEraRef.current  = targetEra;
    animTeamRef.current   = team;
    animEraRef.current    = era;

    // Hide team name during spin
    writeTeamName('\u00A0');

    setPhase('spinning');

    const now = performance.now();
    startRef.current    = now;
    lastTickRef.current = now;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // ---- Watch for spin prop changes ----
  const prevSpinRef = useRef(spin);
  useEffect(() => {
    const prev = prevSpinRef.current;
    prevSpinRef.current = spin;

    if (!spin) {
      // Round cleared — reset display
      writeTeam('???');
      writeEra('???');
      writeTeamName('\u00A0');
      return;
    }
    if (prev === spin) return;

    const teamChanged = !prev || prev.team.code !== spin.team.code;
    const eraChanged  = !prev || prev.decade   !== spin.decade;

    startAnimation(
      teamChanged, eraChanged,
      spin.team.code,
      spin.decade.replace('s', "'s"),
    );
  }, [spin, startAnimation]);

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
          <div
            ref={teamTextRef}
            className="text-3xl font-black text-gray-900 h-10 flex items-center justify-center"
          >
            ???
          </div>
          <div ref={teamNameRef} className="text-xs text-gray-500 mt-1 h-4 truncate">
            {'\u00A0'}
          </div>
        </div>
        {/* ERA reel */}
        <div className="flex-1 rounded-xl border-3 border-purple-500 bg-white p-4 text-center overflow-hidden">
          <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Era</div>
          <div
            ref={eraTextRef}
            className="text-3xl font-black text-gray-900 h-10 flex items-center justify-center"
          >
            ???
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
