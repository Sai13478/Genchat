import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  friendRequests: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: [],
  replyingTo: null,
  editingMessage: null,
  archivedChats: [],
  hiddenChats: [],
  isVaultOpen: false,

  setVaultOpen: (isOpen) => set({ isVaultOpen: isOpen }),

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

  getMessages: async (id, isGroup = false) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await apiClient.get(`/messages/${id}?isGroup=${isGroup}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData, isGroup = false) => {
    const { selectedUser, messages, users, replyingTo } = get();
    if (!selectedUser) return toast.error("No selection");

    try {
      const res = await apiClient.post(`/messages/send/${selectedUser._id}`, {
        ...messageData,
        isGroup,
        replyTo: replyingTo?._id
      });
      set({ messages: [...messages, res.data], replyingTo: null });

      // Move to top
      const updatedUsers = users.filter((u) => u._id !== selectedUser._id);
      set({ users: [selectedUser, ...updatedUsers] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await apiClient.put(`/messages/edit/${messageId}`, { text });
      set({
        messages: get().messages.map(m => m._id === messageId ? res.data : m)
      });
    } catch (error) {
      toast.error("Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await apiClient.delete(`/messages/delete/${messageId}`);
      set({
        messages: get().messages.filter(m => m._id !== messageId)
      });
    } catch (error) {
      toast.error("Failed to delete message");
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const res = await apiClient.post(`/messages/react/${messageId}`, { emoji });
      set({
        messages: get().messages.map(m => m._id === messageId ? res.data : m)
      });
    } catch (error) {
      console.error("Failed to add reaction", error);
    }
  },

  pinMessage: async (messageId) => {
    try {
      const res = await apiClient.post(`/messages/pin/${messageId}`);
      set({
        messages: get().messages.map(m => m._id === messageId ? res.data : m)
      });
      toast.success(res.data.isPinned ? "Message pinned" : "Message unpinned");
    } catch (error) {
      toast.error("Failed to pin message");
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await apiClient.post("/groups/create", groupData);
      toast.success("Group created successfully");
      set({ users: [{ ...res.data, isGroup: true }, ...get().users] });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create group");
    }
  },

  addMembers: async (groupId, membersToAdd) => {
    try {
      const res = await apiClient.post("/groups/add-members", { groupId, membersToAdd });
      toast.success("Members added");
      get().getUsers(); // Refresh users list
      if (get().selectedUser?._id === groupId) {
        set({ selectedUser: { ...get().selectedUser, ...res.data } });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add members");
    }
  },

  removeMember: async (groupId, memberToRemove) => {
    try {
      const res = await apiClient.post("/groups/remove-member", { groupId, memberToRemove });
      toast.success("Action completed");
      get().getUsers(); // Refresh users list
      if (get().selectedUser?._id === groupId) {
        // If searching for self removal (leaving group)
        const authUserId = useAuthStore.getState().authUser._id;
        if (memberToRemove === authUserId) {
          set({ selectedUser: null });
        } else {
          set({ selectedUser: { ...get().selectedUser, ...res.data } });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update member");
    }
  },

  updateGroup: async (groupId, groupData) => {
    try {
      const res = await apiClient.put(`/groups/update/${groupId}`, groupData);
      toast.success("Group updated");
      get().getUsers();
      if (get().selectedUser?._id === groupId) {
        set({ selectedUser: { ...get().selectedUser, ...res.data } });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update group");
    }
  },

  updateGroupSettings: async (groupId, settings) => {
    try {
      const res = await apiClient.put(`/groups/update/${groupId}`, { settings });
      toast.success("Settings updated");
      get().getUsers();
      if (get().selectedUser?._id === groupId) {
        set({ selectedUser: { ...get().selectedUser, ...res.data } });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update settings");
    }
  },

  manageAdmin: async (groupId, memberId, action) => {
    try {
      const res = await apiClient.post("/groups/manage-admin", { groupId, memberId, action });
      toast.success(`User ${action === 'promote' ? 'promoted' : 'demoted'}`);
      get().getUsers();
      if (get().selectedUser?._id === groupId) {
        set({ selectedUser: { ...get().selectedUser, ...res.data } });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to manage admin");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser.isGroup || newMessage.senderId !== selectedUser._id) return;

      set({
        messages: [...get().messages, newMessage],
      });

      socket.emit("markMessagesAsDelivered", {
        conversationId: selectedUser.conversationId,
        userIdOfSender: selectedUser._id
      });
    });

    socket.on("newGroupMessage", (newMessage) => {
      if (!selectedUser.isGroup || newMessage.groupId !== selectedUser._id) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set({
        messages: get().messages.map(m => m._id === updatedMessage._id ? updatedMessage : m)
      });
    });

    socket.on("messageDeleted", (messageId) => {
      set({
        messages: get().messages.filter(m => m._id !== messageId)
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
      set({ users: [{ ...newFriend, isGroup: false }, ...get().users] });
      toast.success(`${newFriend.username} accepted your friend request!`);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messageUpdated");
    socket.off("messageDeleted");
    socket.off("messagesDelivered");
    socket.off("messagesSeen");
    socket.off("friendRequestReceived");
    socket.off("friendRequestAccepted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, messages: [], replyingTo: null, editingMessage: null, typingUsers: [] }),
  setMessages: (messages) => set({ messages }),
  setUsers: (users) => set({ users }),
  setTypingUsers: (userId, username, isTyping) => {
    const { typingUsers } = get();
    if (isTyping) {
      if (!typingUsers.find(u => u.userId === userId)) {
        set({ typingUsers: [...typingUsers, { userId, username }] });
      }
    } else {
      set({ typingUsers: typingUsers.filter(u => u.userId !== userId) });
    }
  },
  setReplyingTo: (message) => set({ replyingTo: message, editingMessage: null }),
  setEditingMessage: (message) => set({ editingMessage: message, replyingTo: null }),

  hideConversation: async (conversationId, secretKey) => {
    try {
      await apiClient.post(`/conversations/hide/${conversationId}`, { secretKey });
      // Remove from active users list
      set((state) => ({ users: state.users.filter((u) => u.conversationId !== conversationId) }));
      toast.success("Chat hidden successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to hide chat.");
    }
  },

  unhideConversation: async (conversationId, secretKey) => {
    try {
      await apiClient.post(`/conversations/unhide/${conversationId}`, { secretKey });
      toast.success("Chat unlocked!");
      // Refresh all lists
      get().getUsers();
      get().loadArchivedChats();
      get().loadHiddenChats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Incorrect secret key.");
    }
  },

  toggleArchive: async (conversationId) => {
    try {
      const res = await apiClient.post(`/conversations/archive/${conversationId}`);
      toast.success(res.data.message);
      // Refresh to update archived state
      get().getUsers();
      get().loadArchivedChats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update archive.");
    }
  },

  loadArchivedChats: async () => {
    try {
      const res = await apiClient.get("/conversations/archived");
      set({ archivedChats: res.data });
    } catch (error) {
      console.error("Failed to load archived chats", error);
    }
  },

  loadHiddenChats: async () => {
    try {
      const res = await apiClient.get("/conversations/hidden");
      set({ hiddenChats: res.data });
    } catch (error) {
      console.error("Failed to load hidden chats", error);
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await apiClient.delete(`/groups/${groupId}`);
      toast.success("Group deleted successfully");
      get().getUsers();
      if (get().selectedUser?._id === groupId) {
        set({ selectedUser: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete group");
    }
  },

  forwardMessage: async (targetId, messageData, isGroup) => {
    try {
      const res = await apiClient.post(`/messages/send/${targetId}`, {
        ...messageData,
        isGroup,
        forwarded: true // Optional flag for UI
      });
      // Optionally move target user/group to top
      get().getUsers();
      toast.success("Message forwarded!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to forward message");
    }
  },
}));
