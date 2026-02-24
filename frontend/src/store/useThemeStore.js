import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: "genchat",
  setTheme: (theme) => {
    // Theme switching is disabled for current design
    set({ theme: "genchat" });
  },
}));
