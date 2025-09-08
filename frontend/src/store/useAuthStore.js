import { create } from "zustand";
import apiClient from "../lib/apiClient";
import toast from "react-hot-toast";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await apiClient.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      if (error.response?.status === 401) {
        console.info("User not logged in (expected).");
      } else {
        console.error("checkAuth error:", error.response?.data?.error || error.message);
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

  registerPasskey: async () => {
    try {
      const options = await apiClient.get("/passkeys/register-options");
      const attestation = await startRegistration(options.data);
      await apiClient.post("/passkeys/verify-registration", attestation);
      toast.success("Passkey registered!");
      get().checkAuth();
    } catch (error) {
      console.error("Passkey registration error:", error);
      toast.error(error?.response?.data?.error || "Passkey registration failed.");
    }
  },

  loginWithPasskey: async () => {
    set({ isLoggingIn: true });
    try {
      const options = await apiClient.get("/passkeys/login-options");
      const assertion = await startAuthentication(options.data);
      const res = await apiClient.post("/passkeys/verify-login", assertion);
      set({ authUser: res.data });
      toast.success("Logged in with passkey!");
    } catch (error) {
      console.error("Passkey login error:", error);
      toast.error(error?.response?.data?.error || "Passkey login failed.");
    } finally {
      set({ isLoggingIn: false });
    }
  },
}));
