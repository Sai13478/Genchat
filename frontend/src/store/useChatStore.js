import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await apiClient.get("/messages/conversations");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await apiClient.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    if (!selectedUser) return toast.error("No user selected");

    try {
      const res = await apiClient.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });

      // Move messaged user to top
      const updatedUsers = users.filter((u) => u._id !== selectedUser._id);
      set({ users: [selectedUser, ...updatedUsers] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),
  setMessages: (messages) => set({ messages }),
  setUsers: (users) => set({ users }),
  setTyping: (isTyping) => set({ isTyping }),
}));
