import { create } from 'zustand';

import { WebFilter } from '../lib/api';

type FilterStore = {
  filters: WebFilter;
  setFilter: <K extends keyof WebFilter>(key: K, value?: WebFilter[K]) => void;
  reset: () => void;
};

const initial: WebFilter = {
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
  maxCalories: undefined,
  minCalories: undefined,
  difficulty: undefined,
  maxPrepTime: undefined,
  origin: undefined,
  allergensFree: undefined,
};

export const useFilters = create<FilterStore>((set) => ({
  filters: initial,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  reset: () => set({ filters: initial }),
}));
