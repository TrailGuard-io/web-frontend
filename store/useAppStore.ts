import { create } from 'zustand';

type AppState = {
  language: 'es' | 'en' | 'pt';
  isPanicActive: boolean;
  setLanguage: (lang: 'es' | 'en' | 'pt') => void;
  triggerPanic: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  language: 'es',
  isPanicActive: false,
  setLanguage: (lang) => set({ language: lang }),
  triggerPanic: () => set({ isPanicActive: true }),
}));
