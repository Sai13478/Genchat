import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("chat-theme") || "genchat-light",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "genchat-dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme });
  },
  toggleTheme: () => {
    const newTheme = get().theme === "genchat-light" ? "genchat-dark" : "genchat-light";
    get().setTheme(newTheme);
  },
  initializeTheme: () => {
    const savedTheme = localStorage.getItem("chat-theme") || "genchat-light";
    get().setTheme(savedTheme);
  }
}));
