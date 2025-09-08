import { create } from "zustand";
import apiClient from "../lib/apiClient";
import toast from "react-hot-toast";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true, // Loader on app startup

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await apiClient.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      // Handle 401 gracefully
      if (error.response?.status === 401) {
        console.info("User is not logged in (expected).");
      } else {
        console.error("Auth check error:", error.response?.data?.error || error.message);
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await apiClient.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
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
      set({ authUser: res.data });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
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
      set({ authUser: res.data.user });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error?.response?.data?.error || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  registerPasskey: async () => {
    try {
      const options = await apiClient.get("/passkeys/register-options");

      // Ensure options.data is JSON (sometimes Axios wraps it)
      const attestation = await startRegistration(options.data);

      await apiClient.post("/passkeys/verify-registration", attestation);

      toast.success("Passkey registered successfully!");
      get().checkAuth();
    } catch (error) {
      console.error("Passkey registration error:", error);
      const message =
        error.response?.data?.error || error.message || "Passkey registration failed.";
      toast.error(message);
    }
  },

  loginWithPasskey: async () => {
    set({ isLoggingIn: true });
    try {
      const options = await apiClient.get("/passkeys/login-options");
      const assertion = await startAuthentication(options.data);

      const res = await apiClient.post("/passkeys/verify-login", assertion);
      set({ authUser: res.data });
      toast.success("Logged in successfully with passkey!");
    } catch (error) {
      console.error("Passkey login error:", error);
      const message =
        error.response?.data?.error || error.message || "Passkey login failed.";
      toast.error(message);
    } finally {
      set({ isLoggingIn: false });
    }
  },
}));
