import type { Pos, Player } from '../engine/types';
import { POSITIONS } from '../engine/types';

interface Props {
  player: Player;
  filledSlots: Set<Pos>;
  onSelect: (slot: Pos) => void;
  onClose: () => void;
}

export function PositionDrawer({ player, filledSlots, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-4 pb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-900 font-semibold text-sm">
          {player.name} — Choose Position
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="flex items-center justify-center gap-4">
        {POSITIONS.map(pos => {
          const filled = filledSlots.has(pos);
          const eligible = player.positions.includes(pos) && !filled;

          return (
            <button
              key={pos}
              onClick={() => eligible && onSelect(pos)}
              disabled={!eligible}
              className={`flex flex-col items-center gap-1 transition ${
                eligible ? 'cursor-pointer' : 'cursor-default opacity-40'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                  eligible
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                {pos}
              </div>
              <span className="text-[10px] text-gray-400">
                {filled ? 'Filled' : eligible ? pos : 'N/A'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
