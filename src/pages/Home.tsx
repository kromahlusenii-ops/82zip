import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { GameMode } from '../engine/types';

export function Home() {
  const navigate = useNavigate();
  const startGame = useGameStore(s => s.startGame);

  const handleStart = (mode: GameMode) => {
    startGame(mode);
    navigate('/draft');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-16 text-center">
      <div className="mb-6">
        <div className="inline-block bg-orange-500 text-white text-3xl font-black px-4 py-2 rounded-xl mb-3">
          82 Zip
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Can you go 82 Zip?</h1>
      </div>

      <h2 className="text-gray-600 font-medium mb-6">Choose Your Mode</h2>
      <p className="text-gray-400 text-sm mb-6">How do you want to build your all-time team?</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Classic */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-orange-500 font-black text-lg mb-2">Classic</div>
          <p className="text-gray-500 text-xs leading-relaxed mb-3">
            Draft with full player stats visible — make informed picks.
          </p>
          <button
            onClick={() => handleStart('classic')}
            className="w-full bg-orange-500 text-white py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition"
          >
            Play Classic
          </button>
        </div>

        {/* HoopIQ */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-purple-500 font-black text-lg mb-2">HoopIQ</div>
          <p className="text-gray-500 text-xs leading-relaxed mb-3">
            Stats hidden — draft by memory and test your ball knowledge.
          </p>
          <button
            onClick={() => handleStart('hoopiq')}
            className="w-full bg-orange-500 text-white py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition"
          >
            Play HoopIQ
          </button>
        </div>
      </div>
    </div>
  );
}
