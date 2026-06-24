import { useState } from 'react';
import { useAuth } from '../auth/authStore';
import { SignInModal } from '../components/SignInModal';

export function Profile() {
  const user = useAuth(s => s.user);
  const [showSignIn, setShowSignIn] = useState(!user);

  if (!user) {
    return (
      <>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
          <p className="text-gray-500 mb-4">Sign in to view your game history and stats.</p>
          <button onClick={() => setShowSignIn(true)} className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold">
            Sign In
          </button>
        </div>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="text-gray-900 font-bold text-lg">{user.name}</div>
        <div className="text-gray-400 text-sm">{user.email}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">0</div>
          <div className="text-xs text-gray-400">Games</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">—</div>
          <div className="text-xs text-gray-400">Best Score</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">—</div>
          <div className="text-xs text-gray-400">Best Record</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-gray-900 font-bold mb-3">Game History</h2>
        <p className="text-gray-400 text-sm">No games recorded yet. Play a game to see your history!</p>
      </div>
    </div>
  );
}
