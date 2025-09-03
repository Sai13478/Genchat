import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient"; // <-- Import the correct, centralized client

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUser: null,
  isMessagesLoading: false,
  isTyping: false,

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await apiClient.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load messages");
      set({ messages: [] }); // Ensure messages is an array on error
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return toast.error("No user selected");

    try {
      const res = await apiClient.post(`/messages/send/${selectedUser._id}`, messageData);
      // Optimistically update the UI for the sender.
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setMessages: (messages) => set({ messages }),
  setTyping: (isTyping) => set({ isTyping }),
  // This setter will be used by our real-time listener hook

}));
