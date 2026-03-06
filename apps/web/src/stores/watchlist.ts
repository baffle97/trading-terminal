import { create } from "zustand";

interface WatchlistStore {
  activeWatchlistId: string | null;
  setActiveWatchlist: (id: string) => void;
}

export const useWatchlistStore = create<WatchlistStore>((set) => ({
  activeWatchlistId: null,
  setActiveWatchlist: (id) => set({ activeWatchlistId: id }),
}));
