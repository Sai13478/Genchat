import { create } from "zustand";
import apiClient from "../lib/apiClient";
import toast from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true, // Start with true to show a loader on app startup

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await apiClient.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
      // apiClient response interceptor handles clearing localStorage
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await apiClient.post("/auth/signup", data);
      localStorage.setItem("genchat-token", res.data.token);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      // Fetch full user data in background
      try {
        const fullUser = await apiClient.get("/auth/check");
        set({ authUser: fullUser.data });
      } catch (e) {
        console.error("Error fetching full user data after signup:", e);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await apiClient.post("/auth/login", data);
      localStorage.setItem("genchat-token", res.data.token);
      // Set initial user data so the app transitions to authenticated layout
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      // Fetch full user data in background to populate all fields (bio, settings, friends, etc.)
      try {
        const fullUser = await apiClient.get("/auth/check");
        set({ authUser: fullUser.data });
      } catch (e) {
        console.error("Error fetching full user data after login:", e);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
      localStorage.removeItem("genchat-token");
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await apiClient.put("/auth/update-profile", data);
      // Merge updated fields into existing authUser to preserve all state
      const currentUser = get().authUser;
      set({ authUser: { ...currentUser, ...res.data.user } });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in update profile:", error);
      toast.error(error?.response?.data?.error || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateSettings: async (data) => {
    try {
      const res = await apiClient.put("/auth/update-settings", { settings: data });
      set({ authUser: { ...get().authUser, settings: res.data.settings } });
      toast.success("Settings updated");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(error?.response?.data?.error || "Failed to update settings");
    }
  },

  getSessions: async () => {
    try {
      const res = await apiClient.get("/auth/sessions");
      return res.data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
  },
}));
