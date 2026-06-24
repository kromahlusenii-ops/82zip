import { useState } from 'react';
import { useAuth } from '../auth/authStore';
import { SignInModal } from '../components/SignInModal';

export function MyChallenges() {
  const user = useAuth(s => s.user);
  const [showSignIn, setShowSignIn] = useState(!user);

  if (!user) {
    return (
      <>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Challenges</h1>
          <p className="text-gray-500 mb-4">Sign in to create and view your head-to-head challenges.</p>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Challenges</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-400 text-sm">No challenges yet. Play a game and create a "Beat My Team" challenge!</p>
      </div>
    </div>
  );
}
