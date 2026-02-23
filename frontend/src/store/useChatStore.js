import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

export const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  friendRequests: [],
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
      const res = await apiClient.get(`/messages/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "User not found");
      return null;
    }
  },

  sendFriendRequest: async (targetId) => {
    try {
      const res = await apiClient.post(`/messages/friend-request/${targetId}`);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send request");
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await apiClient.get("/messages/friend-requests");
      set({ friendRequests: res.data });
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      const res = await apiClient.post("/messages/friend-request/accept", { requestId });
      toast.success(res.data.message);
      // Remove from requests and add to users
      set({
        friendRequests: get().friendRequests.filter(req => req.from._id !== requestId),
        users: [res.data.friend, ...get().users]
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to accept request");
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      const res = await apiClient.post("/messages/friend-request/reject", { requestId });
      toast.success(res.data.message);
      set({
        friendRequests: get().friendRequests.filter(req => req.from._id !== requestId)
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reject request");
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

    // Social Events
    socket.on("friendRequestReceived", (newRequest) => {
      set({ friendRequests: [newRequest, ...get().friendRequests] });
      toast.success(`${newRequest.from.username} sent you a friend request!`);
    });

    socket.on("friendRequestAccepted", (newFriend) => {
      set({ users: [newFriend, ...get().users] });
      toast.success(`${newFriend.username} accepted your friend request!`);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesDelivered");
    socket.off("messagesSeen");
    socket.off("friendRequestReceived");
    socket.off("friendRequestAccepted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),
  setMessages: (messages) => set({ messages }),
  setUsers: (users) => set({ users }),
  setTyping: (isTyping) => set({ isTyping }),
}));
