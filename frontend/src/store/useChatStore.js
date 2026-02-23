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
      const res = await apiClient.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUser: async (query) => {
    try {
      const res = await apiClient.get(`/messages/search/${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "User not found");
      return null;
    }
  },

  addFriend: async (friendId) => {
    try {
      const res = await apiClient.post("/messages/add-friend", { friendId });
      toast.success(res.data.message);
      set({ users: [res.data.friend, ...get().users] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add friend");
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

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;

      set({
        messages: [...get().messages, newMessage],
      });

      // Notify sender that message is delivered (receiver is online)
      socket.emit("markMessagesAsDelivered", {
        conversationId: selectedUser.conversationId,
        userIdOfSender: selectedUser._id
      });
    });

    socket.on("messagesDelivered", ({ conversationId, receiverId }) => {
      const { messages } = get();
      const updatedMessages = messages.map((m) => {
        if (m.receiverId === receiverId || m.conversationId === conversationId) {
          return { ...m, delivered: true };
        }
        return m;
      });
      set({ messages: updatedMessages });
    });

    socket.on("messagesSeen", ({ conversationId }) => {
      const { messages } = get();
      const updatedMessages = messages.map((m) => {
        if (m.conversationId === conversationId) {
          return { ...m, seen: true, delivered: true };
        }
        return m;
      });
      set({ messages: updatedMessages });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesDelivered");
    socket.off("messagesSeen");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),
  setMessages: (messages) => set({ messages }),
  setUsers: (users) => set({ users }),
  setTyping: (isTyping) => set({ isTyping }),
}));
