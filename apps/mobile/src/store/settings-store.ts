import { create } from 'zustand';

interface SettingsStore {
  language: 'vi' | 'en';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  reduceMotion: boolean;
  disableConfetti: boolean;
  textScale: number;
  swipeModeEnabled: boolean;
  setLanguage: (lang: 'vi' | 'en') => void;
  setSound: (v: boolean) => void;
  setHaptic: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setDisableConfetti: (v: boolean) => void;
  setTextScale: (v: number) => void;
  setSwipeModeEnabled: (v: boolean) => void;
  applyFromServer: (s: Partial<SettingsStore>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: 'vi',
  soundEnabled: true,
  hapticEnabled: true,
  reduceMotion: false,
  disableConfetti: false,
  textScale: 1,
  swipeModeEnabled: false,
  setLanguage: (val) => set({ language: val }),
  setSound: (val) => set({ soundEnabled: val }),
  setHaptic: (val) => set({ hapticEnabled: val }),
  setReduceMotion: (val) => set({ reduceMotion: val }),
  setDisableConfetti: (val) => set({ disableConfetti: val }),
  setTextScale: (val) => set({ textScale: val }),
  setSwipeModeEnabled: (val) => set({ swipeModeEnabled: val }),
  applyFromServer: (s) => set((prev) => ({ ...prev, ...s })),
}));
