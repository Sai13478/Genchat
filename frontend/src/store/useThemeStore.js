import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("chat-theme") || "genchat-light",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    const newTheme = get().theme === "genchat-light" ? "genchat-dark" : "genchat-light";
    localStorage.setItem("chat-theme", newTheme);
    set({ theme: newTheme });
  }
}));
