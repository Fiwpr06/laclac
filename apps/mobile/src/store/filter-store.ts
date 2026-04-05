import { create } from 'zustand';

import { MobileFilter } from '../lib/api';

type FilterStore = {
  filters: MobileFilter;
  setFilter: <K extends keyof MobileFilter>(key: K, value?: MobileFilter[K]) => void;
  reset: () => void;
};

const initialFilters: MobileFilter = {
  priceRange: undefined,
  mealType: undefined,
  dietTag: undefined,
  context: undefined,
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  reset: () => set({ filters: initialFilters }),
}));
