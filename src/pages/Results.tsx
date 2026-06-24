import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../auth/authStore';
import { useState } from 'react';
import { SignInModal } from '../components/SignInModal';

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-500',
  'A+': 'text-green-500',
  A: 'text-green-600',
  B: 'text-blue-500',
  C: 'text-gray-500',
  D: 'text-orange-500',
  F: 'text-red-500',
};

export function Results() {
  const navigate = useNavigate();
  const { mode, result, placed, reset } = useGameStore();
  const user = useAuth(s => s.user);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (!result) navigate('/');
  }, [result, navigate]);

  if (!result) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-block bg-orange-500 text-white text-xl font-black px-3 py-1 rounded-lg mb-3">
          82 Zip
        </div>
        <p className="text-gray-500 text-sm">Can you go 82 Zip?</p>
      </div>

      {/* Mode badge */}
      <div className="flex justify-center mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${mode === 'hoopiq' ? 'text-purple-500' : 'text-orange-500'}`}>
          {mode === 'hoopiq' ? 'HoopIQ Mode' : 'Classic Mode'}
        </span>
      </div>

      {/* Projected record */}
      <div className="text-center mb-2">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Projected Record</div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-7xl sm:text-8xl font-black text-gray-900">{result.wins}</span>
          <span className="text-3xl text-gray-300 font-light">—</span>
          <span className="text-7xl sm:text-8xl font-black text-gray-900">{result.losses}</span>
        </div>
      </div>

      {/* Grade */}
      <div className="text-center mb-6">
        <span className={`text-2xl font-black ${GRADE_COLORS[result.grade] || 'text-gray-700'}`}>
          {result.grade}
        </span>
        <span className="text-gray-500 font-semibold ml-2 uppercase text-sm">{result.label}</span>
        <span className="text-gray-400 ml-2 text-sm">· {result.ovr} pts</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigator.clipboard?.writeText(`I went ${result.wins}-${result.losses} (${result.grade}) on 82 Zip! ${result.ovr} pts`)}
          className="flex-1 bg-orange-500 text-white py-3 rounded-full font-bold text-sm hover:bg-orange-600 transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Share
        </button>
        <button
          onClick={() => { reset(); navigate('/'); }}
          className="flex-1 bg-white text-gray-700 py-3 rounded-full font-bold text-sm border border-gray-200 hover:bg-gray-50 transition"
        >
          Build Another
        </button>
      </div>

      {/* Sign-in prompt */}
      {!user && (
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="text-gray-900 font-semibold text-sm">Sign in to rank this game</div>
              <div className="text-gray-400 text-xs">Save your score to your profile and the leaderboard.</div>
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shrink-0 ml-3"
            >
              Sign in
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="text-gray-900 font-semibold text-sm">Can anyone beat your team?</div>
              <div className="text-gray-400 text-xs">Create a challenge and share it head-to-head.</div>
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shrink-0 ml-3">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Roster */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="text-gray-900 font-bold text-sm mb-3">Your Roster</h3>
        <div className="divide-y divide-gray-100">
          {placed.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-500 text-xs font-bold">{p.slot}</span>
                  <span className="text-gray-900 font-semibold text-sm truncate">{p.player.name}</span>
                </div>
                <span className="text-gray-400 text-[11px]">{p.player.team} · {p.player.decade}</span>
              </div>
              <div className="flex gap-1.5 text-[11px] text-gray-500 tabular-nums shrink-0 ml-2">
                <span>{p.player.stats.ppg}</span>
                <span>{p.player.stats.rpg}</span>
                <span>{p.player.stats.apg}</span>
                <span>{p.player.stats.spg}</span>
                <span>{p.player.stats.bpg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team totals */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-gray-900 font-bold text-sm mb-2">Team Totals</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div><div className="text-gray-400 text-[10px]">PPG</div><div className="text-gray-900 font-bold text-sm">{result.totals.ppg.toFixed(1)}</div></div>
          <div><div className="text-gray-400 text-[10px]">RPG</div><div className="text-gray-900 font-bold text-sm">{result.totals.rpg.toFixed(1)}</div></div>
          <div><div className="text-gray-400 text-[10px]">APG</div><div className="text-gray-900 font-bold text-sm">{result.totals.apg.toFixed(1)}</div></div>
          <div><div className="text-gray-400 text-[10px]">SPG*</div><div className="text-gray-900 font-bold text-sm">{result.totals.adjSpg.toFixed(1)}</div></div>
          <div><div className="text-gray-400 text-[10px]">BPG*</div><div className="text-gray-900 font-bold text-sm">{result.totals.adjBpg.toFixed(1)}</div></div>
        </div>
        <p className="text-gray-300 text-[10px] mt-2">* Adjusted (zero-exclusion rule)</p>
      </div>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
