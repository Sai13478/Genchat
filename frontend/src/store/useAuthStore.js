import { create } from "zustand";
import apiClient from "../lib/apiClient";
import toast from "react-hot-toast";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true, // Start with true to show a loader on app startup

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      // Use the new apiClient which has the correct base URL ("/api")
      const res = await apiClient.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      if (error.response?.status === 401) {
        // This is the expected flow for an unauthenticated user.
        console.info("Auth check failed (401): User is not logged in. This is expected.");
      } else {
        // Log other errors more verbosely.
        console.error("Error in checkAuth:", error.response?.data?.error || error.message);
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
      // Update authUser with the new user data from the response
      set({ authUser: res.data.user });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in update profile:", error);
      toast.error(error?.response?.data?.error || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  registerPasskey: async () => {
    try {
      // 1. Get options from server
      const options = await apiClient.get("/passkeys/register-options");

      // 2. Ask browser for new credential
      const attestation = await startRegistration({ optionsJSON: options.data });

      // 3. Send new credential to server for verification
      await apiClient.post("/passkeys/verify-registration", attestation);

      toast.success("Passkey registered successfully!");
      // Optionally, refresh user data to show new passkey
      get().checkAuth();
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Passkey registration failed.";
      console.error("Passkey registration error:", error);
      toast.error(errorMessage);
    }
  },

  loginWithPasskey: async () => {
    set({ isLoggingIn: true });
    try {
      // 1. Get options from server
      const options = await apiClient.get("/passkeys/login-options");

      // 2. Ask browser for assertion
      const assertion = await startAuthentication({ optionsJSON: options.data });

      // 3. Send assertion to server for verification
      const res = await apiClient.post("/passkeys/verify-login", assertion);
      set({ authUser: res.data });
      toast.success("Logged in successfully with passkey!");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Passkey login failed.");
    } finally {
      set({ isLoggingIn: false });
    }
  },
}));
