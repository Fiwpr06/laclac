import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FoodItem } from '../lib/api';

type HistoryStore = {
  history: FoodItem[];
  addHistory: (food: FoodItem) => void;
  clearHistory: () => void;
};

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      history: [],
      addHistory: (food) =>
        set((state) => {
          const filtered = state.history.filter((f) => f._id !== food._id);
          return {
            history: [food, ...filtered].slice(0, 30),
          };
        }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'laclac-web-history',
    }
  )
);
