import { create } from "zustand";

interface UserState {
  token: string | null;
  email: string | null;
  setToken: (token: string) => void;
  setEmail: (email: string) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  token: null,
  email: null,
  setToken: (token) => set({ token }),
  setEmail: (email) => set({ email }),
  clear: () => set({ token: null, email: null }),
}));
