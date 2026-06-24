import type { Pos, PlacedPlayer, Player } from '../engine/types';
import { POSITIONS } from '../engine/types';

interface Props {
  placed: PlacedPlayer[];
  filledSlots: Set<Pos>;
  selectedPlayer: Player | null;
  onSlotClick: (slot: Pos) => void;
}

const SLOT_POSITIONS: Record<Pos, { top: string; left: string }> = {
  PG: { top: '75%', left: '50%' },
  SG: { top: '55%', left: '20%' },
  SF: { top: '55%', left: '80%' },
  PF: { top: '30%', left: '25%' },
  C: { top: '30%', left: '75%' },
};

export function CourtDiagram({ placed, filledSlots, selectedPlayer, onSlotClick }: Props) {
  const eligibleSlots = selectedPlayer
    ? selectedPlayer.positions.filter(p => !filledSlots.has(p))
    : [];

  const placedMap = new Map(placed.map(p => [p.slot, p.player]));

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[4/3] bg-gradient-to-b from-amber-800 to-amber-900 rounded-2xl border-2 border-amber-600 overflow-hidden">
      {/* Court markings */}
      <div className="absolute inset-4 border-2 border-amber-500/40 rounded-lg" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-amber-500/40 rounded-full" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-amber-500/40 rounded-b-full" />

      {POSITIONS.map(pos => {
        const { top, left } = SLOT_POSITIONS[pos];
        const filled = filledSlots.has(pos);
        const isEligible = eligibleSlots.includes(pos);
        const placedPlayer = placedMap.get(pos);

        return (
          <button
            key={pos}
            onClick={() => isEligible && onSlotClick(pos)}
            style={{ top, left }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all ${
              filled
                ? 'bg-orange-500 text-white cursor-default'
                : isEligible
                ? 'bg-green-500 text-white animate-pulse cursor-pointer ring-2 ring-green-300'
                : 'bg-gray-800/80 text-gray-400 cursor-default'
            }`}
          >
            <span className="text-[10px] opacity-75">{pos}</span>
            {placedPlayer && (
              <span className="text-[10px] font-bold mt-0.5">
                {placedPlayer.name.split(' ').map(w => w[0]).join('')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
