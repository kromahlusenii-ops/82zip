import { Link } from 'react-router-dom';
import { useAuth } from '../auth/authStore';
import { useState } from 'react';
import { SignInModal } from './SignInModal';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-black text-orange-500 tracking-tight">82 Zip</Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile" className="text-gray-500 hover:text-gray-800 text-sm">Profile</Link>
                <span className="text-gray-400 text-sm">{user.name}</span>
                <button onClick={signOut} className="text-xs text-orange-500 hover:text-orange-600">Sign Out</button>
              </>
            ) : (
              <button onClick={() => setShowSignIn(true)} className="text-sm text-gray-500 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            )}
          </div>
        </div>
      </nav>
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </>
  );
}
