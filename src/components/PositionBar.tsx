import type { Pos, PlacedPlayer, Player } from '../engine/types';
import { POSITIONS } from '../engine/types';

interface Props {
  placed: PlacedPlayer[];
  filledSlots: Set<Pos>;
  selectedPlayer: Player | null;
  onSlotClick: (slot: Pos) => void;
}

export function PositionBar({ placed, filledSlots, selectedPlayer, onSlotClick }: Props) {
  const eligibleSlots = selectedPlayer
    ? selectedPlayer.positions.filter(p => !filledSlots.has(p))
    : [];

  const placedMap = new Map(placed.map(p => [p.slot, p.player]));

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 py-3">
      {POSITIONS.map(pos => {
        const filled = filledSlots.has(pos);
        const isEligible = eligibleSlots.includes(pos);
        const placedPlayer = placedMap.get(pos);

        return (
          <button
            key={pos}
            onClick={() => isEligible && onSlotClick(pos)}
            className={`flex flex-col items-center gap-0.5 transition-all ${
              isEligible ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                filled
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : isEligible
                  ? 'bg-orange-500 border-orange-400 text-white animate-pulse ring-2 ring-orange-300'
                  : 'bg-transparent border-dashed border-gray-300 text-gray-400'
              }`}
            >
              {filled ? (
                <span className="text-xs font-bold">
                  {placedPlayer?.name.split(' ').map(w => w[0]).join('')}
                </span>
              ) : isEligible ? (
                <span>{pos}</span>
              ) : (
                <span className="text-xs">{pos}</span>
              )}
            </div>
            <span className={`text-[10px] ${filled ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
              {filled ? placedPlayer?.name.split(' ').pop() : pos}
            </span>
          </button>
        );
      })}
    </div>
  );
}
