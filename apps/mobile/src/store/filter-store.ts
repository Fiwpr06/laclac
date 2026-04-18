import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MobileFilter } from '../lib/api';

type FilterStore = {
  filters: MobileFilter;
  setFilter: <K extends keyof MobileFilter>(key: K, value?: MobileFilter[K]) => void;
  reset: () => void;
};

const initialFilters: MobileFilter = {
  priceRange: undefined,
  budgetBucket: undefined,
  dishType: undefined,
  cuisineType: undefined,
  category: undefined,
  mealType: undefined,
  dietTag: undefined,
  allergenExclude: undefined,
  cookingStyle: undefined,
  context: undefined,
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: initialFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        })),
      reset: () => set({ filters: initialFilters }),
    }),
    {
      name: 'laclac-filter-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
