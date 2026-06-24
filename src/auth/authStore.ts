import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  signIn: (email: string, password: string) => void;
  signInWithGoogle: () => void;
  signOut: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  signIn: (email: string, _password: string) => {
    set({
      user: { id: 'mock-' + Date.now(), email, name: email.split('@')[0] },
    });
  },
  signInWithGoogle: () => {
    set({
      user: { id: 'google-mock-' + Date.now(), email: 'player@gmail.com', name: 'NBA Fan' },
    });
  },
  signOut: () => set({ user: null }),
}));
