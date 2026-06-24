import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, selectCanSkipTeam, selectCanSkipEra } from '../store/gameStore';
import { SlotMachine } from '../components/SlotMachine';
import { PlayerList } from '../components/PlayerList';
import { PositionBar } from '../components/PositionBar';
import { PositionDrawer } from '../components/PositionDrawer';
import { CourtDiagram } from '../components/CourtDiagram';

export function Draft() {
  const navigate = useNavigate();
  const {
    mode, round, placed, filledSlots, spin, selectedPlayer,
    result,
    doSpin, skipTeam, skipEra, selectPlayer, placePlayer,
  } = useGameStore();

  const canSkipTeam = useGameStore(selectCanSkipTeam);
  const canSkipEra = useGameStore(selectCanSkipEra);

  // Track whether the reel animation has finished so the player list reveals only after lock
  const [reelLocked, setReelLocked] = useState(false);

  // Reset lock when spin changes (new round or skip)
  useEffect(() => {
    setReelLocked(false);
  }, [spin]);

  const handleAnimationDone = useCallback(() => {
    setReelLocked(true);
  }, []);

  useEffect(() => {
    if (!mode) navigate('/');
  }, [mode, navigate]);

  useEffect(() => {
    if (result) navigate('/results');
  }, [result, navigate]);

  if (!mode) return null;

  const isHoopIQ = mode === 'hoopiq';

  const poolHasEligible = spin?.pool.some(p =>
    p.positions.some(pos => !filledSlots.has(pos))
  ) ?? false;
  const spinDisabled = round > 5 || (!!spin && poolHasEligible);

  const handlePlacePlayer = (slot: typeof import('../engine/types').POSITIONS[number]) => {
    placePlayer(slot);
  };

  // Player list is visible only after reel locks
  const showPlayerList = !!spin && reelLocked;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 lg:max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded">82Z</span>
          <span className="text-gray-800 font-bold text-sm">Round {round}/5</span>
          {isHoopIQ && (
            <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">HOOPIQ</span>
          )}
        </div>
        {showPlayerList && spin && (
          <div className="flex items-center gap-1">
            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{spin.team.code}</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">{spin.decade.replace('s', "'s")}</span>
          </div>
        )}
      </div>

      {/* Desktop: two columns / Mobile: stacked */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Main content */}
        <div>
          {/* Slot machine — always visible during the round */}
          {!showPlayerList && (
            <div className="mb-4">
              <SlotMachine
                spin={spin}
                onSpin={doSpin}
                onSkipTeam={skipTeam}
                onSkipEra={skipEra}
                disabled={spinDisabled}
                canSkipTeam={canSkipTeam}
                canSkipEra={canSkipEra}
                onAnimationDone={handleAnimationDone}
              />
            </div>
          )}

          {/* Skip controls + player list (shown after reel locks) */}
          {showPlayerList && spin && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => skipTeam()}
                  disabled={!canSkipTeam}
                  className="text-orange-500 text-xs font-semibold hover:bg-orange-50 px-2.5 py-1.5 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Team
                </button>
                <button
                  onClick={() => skipEra()}
                  disabled={!canSkipEra}
                  className="text-purple-500 text-xs font-semibold hover:bg-purple-50 px-2.5 py-1.5 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Era
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <PlayerList
                  pool={spin.pool}
                  filledSlots={filledSlots}
                  selectedPlayer={selectedPlayer}
                  onSelect={selectPlayer}
                  hideStats={isHoopIQ}
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop court diagram */}
        <div className="hidden lg:block mt-4">
          <CourtDiagram
            placed={placed}
            filledSlots={filledSlots}
            selectedPlayer={selectedPlayer}
            onSlotClick={placePlayer}
          />
        </div>
      </div>

      {/* Mobile position bar (fixed at bottom) */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 z-30">
        <PositionBar
          placed={placed}
          filledSlots={filledSlots}
          selectedPlayer={selectedPlayer}
          onSlotClick={placePlayer}
        />
      </div>

      {/* Mobile position drawer (when player selected) */}
      {selectedPlayer && (
        <div className="lg:hidden">
          <PositionDrawer
            player={selectedPlayer}
            filledSlots={filledSlots}
            onSelect={handlePlacePlayer}
            onClose={() => selectPlayer(null as any)}
          />
        </div>
      )}
    </div>
  );
}
