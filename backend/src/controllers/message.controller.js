import mongoose from "mongoose";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		// 1. Get the logged-in user with their friends populated
		const user = await User.findById(loggedInUserId).populate({
			path: "friends",
			select: "-password",
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// 2. Get all groups for the logged-in user
		const groups = await Group.find({ members: loggedInUserId }).populate("admins", "username profilePic");

		// 3. Get all conversations for the logged-in user to sort by recency
		const conversations = await Conversation.find({
			participants: loggedInUserId,
		}).sort({ updatedAt: -1 });

		// Build sets of hidden and archived conversation IDs for this user
		const hiddenConvIds = new Set(
			conversations
				.filter((c) => c.hiddenFor?.some((h) => h.userId?.toString() === loggedInUserId.toString()))
				.map((c) => c._id.toString())
		);
		const archivedConvIds = new Set(
			conversations
				.filter((c) => c.archivedFor?.some((id) => id?.toString() === loggedInUserId.toString()))
				.map((c) => c._id.toString())
		);

		// Build a map: otherId  → conversationId (for 1-1 chats)
		const userToConvMap = {};
		conversations.filter(c => !c.isGroup).forEach(c => {
			const otherId = c.participants.find(p => p.toString() !== loggedInUserId.toString());
			if (otherId) userToConvMap[otherId.toString()] = c._id.toString();
		});

		// 4. Extract categories
		const interactedUserIds = conversations
			.filter(c => !c.isGroup)
			.map(conv =>
				conv.participants.find(p => p.toString() !== loggedInUserId.toString())
			).filter(Boolean);

		// 5. Sort the friends: those in interactedUserIds first, then the rest
		const friends = user.friends || [];
		const sortedFriends = [...friends].sort((a, b) => {
			const idA = a._id?.toString();
			const idB = b._id?.toString();

			const indexA = interactedUserIds.indexOf(idA);
			const indexB = interactedUserIds.indexOf(idB);

			if (indexA !== -1 && indexB !== -1) return indexA - indexB;
			if (indexA !== -1) return -1;
			if (indexB !== -1) return 1;

			const nameA = a.username || a.email || "User";
			const nameB = b.username || b.email || "User";
			return nameA.localeCompare(nameB);
		});

		// 6. Format friends — attach conversationId, exclude hidden/archived
		const finalFriends = sortedFriends
			.map(f => {
				const convId = userToConvMap[f._id.toString()];
				return {
					...f.toObject ? f.toObject() : f,
					username: f.username || f.email?.split("@")[0] || "User",
					tag: f.tag || "0000",
					isGroup: false,
					conversationId: convId,
					isHidden: convId ? hiddenConvIds.has(convId) : false,
					isArchived: convId ? archivedConvIds.has(convId) : false,
				};
			})
			.filter(f => !f.isHidden && !f.isArchived);

		// 7. Format groups — exclude hidden/archived
		const finalGroups = groups
			.map(g => {
				const conv = conversations.find(c => c.isGroup && c.groupId?.toString() === g._id.toString());
				const convId = conv?._id.toString();
				return {
					...g.toObject(),
					isGroup: true,
					conversationId: convId,
					isHidden: convId ? hiddenConvIds.has(convId) : false,
					isArchived: convId ? archivedConvIds.has(convId) : false,
				};
			})
			.filter(g => !g.isHidden && !g.isArchived);

		res.status(200).json([...finalGroups, ...finalFriends]);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const searchUser = async (req, res) => {
	try {
		const { q: query } = req.query; // Expecting "username#tag" via ?q=...

		if (!query || !query.includes("#")) {
			return res.status(400).json({ error: "Invalid search query. Use 'username#tag'." });
		}

		const [username, tag] = query.split("#");

		if (!username || !tag) {
			return res.status(400).json({ error: "Invalid search query. Use 'username#tag'." });
		}

		const user = await User.findOne({ username, tag }).select("-password");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("Error in searchUser: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const sendFriendRequest = async (req, res) => {
	try {
		const { id: targetId } = req.params;
		const senderId = req.user._id;

		if (senderId.toString() === targetId) {
			return res.status(400).json({ error: "You cannot send a friend request to yourself." });
		}

		const targetUser = await User.findById(targetId);
		const senderUser = await User.findById(senderId);

		if (!targetUser) {
			return res.status(404).json({ error: "User not found." });
		}

		// Check if already friends
		if (senderUser.friends.includes(targetId)) {
			return res.status(400).json({ error: "You are already friends." });
		}

		// Check if request already sent
		const alreadyRequested = targetUser.friendRequests.some(fr => fr.from.toString() === senderId.toString());
		if (alreadyRequested) {
			return res.status(400).json({ error: "Friend request already sent." });
		}

		// Check if they already sent YOU a request
		const sentMeRequest = senderUser.friendRequests.some(req => req.from.toString() === targetId);
		if (sentMeRequest) {
			return res.status(400).json({ error: "This user has already sent you a request. Check your requests!" });
		}

		targetUser.friendRequests.push({ from: senderId });
		await targetUser.save();

		// Real-time notification
		const { getIO, getReceiverSocketIds } = await import("../lib/socket.js");
		const io = getIO();
		const receiverSocketIds = getReceiverSocketIds(targetId);
		receiverSocketIds.forEach(socketId => {
			io.to(socketId).emit("friendRequestReceived", {
				from: {
					_id: senderUser._id,
					username: senderUser.username,
					tag: senderUser.tag,
					profilePic: senderUser.profilePic
				},
				createdAt: new Date()
			});
		});

		res.status(200).json({ message: "Friend request sent successfully." });
	} catch (error) {
		console.error("Error in sendFriendRequest:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getFriendRequests = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate("friendRequests.from", "username tag profilePic _id");
		res.status(200).json(user.friendRequests || []);
	} catch (error) {
		console.error("Error in getFriendRequests:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const acceptFriendRequest = async (req, res) => {
	try {
		const { requestId } = req.body;
		if (!req.user || !req.user._id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const userId = req.user._id;

		console.log(`[FriendRequest] Starting accept process. From: ${requestId}, To: ${userId}`);

		if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
			console.error(`[FriendRequest] Invalid requestId format: ${requestId}`);
			return res.status(400).json({ error: "Invalid request ID format." });
		}

		// Fetch both users in parallel for efficiency
		const [user, friendUser] = await Promise.all([
			User.findById(userId),
			User.findById(requestId)
		]);

		if (!user) {
			console.error(`[FriendRequest] Authenticated user ${userId} not found in DB`);
			return res.status(404).json({ error: "Authenticated user not found." });
		}
		if (!friendUser) {
			console.error(`[FriendRequest] Sender user ${requestId} not found in DB`);
			return res.status(404).json({ error: "Sender user no longer exists." });
		}

		// Ensure arrays exist (defensive against corrupt/missing data)
		if (!Array.isArray(user.friends)) user.friends = [];
		if (!Array.isArray(friendUser.friends)) friendUser.friends = [];
		if (!Array.isArray(user.friendRequests)) user.friendRequests = [];

		const requestIdStr = requestId.toString();
		const userIdStr = userId.toString();

		// Check for existing request
		const requestIndex = user.friendRequests.findIndex(fr => fr.from && fr.from.toString() === requestIdStr);

		const alreadyFriendsInUser = user.friends.some(f => f && f.toString() === requestIdStr);
		const alreadyFriendsInSender = friendUser.friends.some(f => f && f.toString() === userIdStr);

		if (requestIndex === -1 && !alreadyFriendsInUser) {
			console.warn(`[FriendRequest] No active request found for ${requestIdStr} in user ${userIdStr}`);
			return res.status(404).json({ error: "Friend request not found or already processed." });
		}

		// Update logged-in user
		let userModified = false;
		if (!alreadyFriendsInUser) {
			user.friends.push(requestId);
			userModified = true;
		}
		if (requestIndex !== -1) {
			user.friendRequests.splice(requestIndex, 1);
			userModified = true;
		}
		if (userModified) {
			await user.save();
			console.log(`[FriendRequest] Updated user ${userIdStr} record`);
		}

		// Update sender
		if (!alreadyFriendsInSender) {
			friendUser.friends.push(userId);
			await friendUser.save();
			console.log(`[FriendRequest] Updated sender ${requestIdStr} record`);
		}

		// Socket notification for the other person (non-critical)
		try {
			const { getIO, getReceiverSocketIds } = await import("../lib/socket.js");
			const io = getIO();
			if (io) {
				const friendSocketIds = getReceiverSocketIds(requestIdStr);
				friendSocketIds.forEach(socketId => {
					io.to(socketId).emit("friendRequestAccepted", {
						_id: user._id,
						username: user.username,
						tag: user.tag,
						profilePic: user.profilePic
					});
				});
				console.log(`[FriendRequest] Socket notification sent to ${friendSocketIds.length} sockets`);
			}
		} catch (socketError) {
			console.error("[FriendRequest] Socket notification skipped:", socketError.message);
		}

		res.status(200).json({
			message: "Friend request accepted.",
			friend: {
				_id: friendUser._id,
				username: friendUser.username,
				tag: friendUser.tag,
				profilePic: friendUser.profilePic
			}
		});
	} catch (error) {
		console.error("CRITICAL error in acceptFriendRequest:", error);
		res.status(500).json({
			error: "Internal Server Error",
			details: error.message,
			code: error.code || "UNKNOWN_ERROR"
		});
	}
};

export const rejectFriendRequest = async (req, res) => {
	try {
		const { requestId } = req.body;
		if (!req.user || !req.user._id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const userId = req.user._id;

		console.log(`[FriendRequest] Rejecting request. From: ${requestId}, To: ${userId}`);

		if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
			console.error(`[FriendRequest] Invalid requestId format: ${requestId}`);
			return res.status(400).json({ error: "Invalid request ID format." });
		}

		const user = await User.findById(userId);
		if (!user) {
			console.error(`[FriendRequest] Authenticated user ${userId} not found in DB`);
			return res.status(404).json({ error: "User not found." });
		}

		if (!Array.isArray(user.friendRequests)) user.friendRequests = [];

		const requestIdStr = requestId.toString();
		const initialLength = user.friendRequests.length;

		user.friendRequests = user.friendRequests.filter(fr => fr.from && fr.from.toString() !== requestIdStr);

		if (user.friendRequests.length === initialLength) {
			console.warn(`[FriendRequest] No request found to reject for ${requestIdStr} in user ${userId}`);
		}

		await user.save();

		res.status(200).json({ message: "Friend request rejected." });
	} catch (error) {
		console.error("CRITICAL error in rejectFriendRequest:", error);
		res.status(500).json({
			error: "Internal Server Error",
			details: error.message,
			code: error.code || "UNKNOWN_ERROR"
		});
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { text, image, replyTo, isGroup } = req.body;
		const { id: targetId } = req.params; // receiverId or groupId
		const senderId = req.user._id;

		let conversation;
		let newMessage;

		if (isGroup) {
			conversation = await Conversation.findOne({ groupId: targetId });
			if (!conversation) return res.status(404).json({ error: "Group conversation not found" });

			const group = await Group.findById(targetId);
			if (!group) return res.status(404).json({ error: "Group not found" });

			// Check if user is a member of the group
			const isMember = group.members.some(id => id.toString() === senderId.toString());
			if (!isMember) {
				return res.status(403).json({ error: "You are not a member of this group" });
			}

			// Check broadcast settings
			if (group.settings?.sendMessages) {
				const isAdmin = group.admins.some(id => id.toString() === senderId.toString());
				if (!isAdmin) {
					return res.status(403).json({ error: "Only admins can send messages to this group" });
				}
			}

			newMessage = new Message({
				senderId,
				groupId: targetId,
				text,
				image: image || "",
				conversationId: conversation._id,
				replyTo: replyTo || null,
			});
		} else {
			conversation = await Conversation.findOne({
				participants: { $all: [senderId, targetId] },
				isGroup: false,
			});

			if (!conversation) {
				conversation = await Conversation.create({
					participants: [senderId, targetId],
					isGroup: false,
				});
			}

			newMessage = new Message({
				senderId,
				receiverId: targetId,
				text,
				image: image || "",
				conversationId: conversation._id,
				replyTo: replyTo || null,
			});

			// Check if receiver is online
			const { getReceiverSocketIds } = await import("../lib/socket.js");
			const receiverSocketIds = getReceiverSocketIds(targetId);
			if (receiverSocketIds.size > 0) {
				newMessage.delivered = true;
			}
		}

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET.IO
		const { getIO } = await import("../lib/socket.js");
		const io = getIO();

		if (isGroup) {
			// Emit to all members of the group
			const group = await Group.findById(targetId);
			group.members.forEach(memberId => {
				if (memberId.toString() !== senderId.toString()) {
					io.to(memberId.toString()).emit("newGroupMessage", { ...newMessage.toObject(), groupId: targetId });
				}
			});
		} else {
			io.to(targetId).emit("newMessage", newMessage);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.error("Error in sendMessage controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: targetId } = req.params;
		const senderId = req.user._id;
		const { isGroup } = req.query;

		let messages;
		if (isGroup === "true") {
			const group = await Group.findById(targetId);
			if (!group) return res.status(404).json({ error: "Group not found" });

			// Check if user is a member of the group
			const isMember = group.members.some(id => id.toString() === senderId.toString());
			if (!isMember) {
				return res.status(403).json({ error: "Access denied. You are not a member of this group." });
			}

			// For groups, query by groupId directly
			messages = await Message.find({ groupId: targetId }).sort({ createdAt: 1 });
		} else {
			// For DMs, query all messages between the two users in either direction
			messages = await Message.find({
				$or: [
					{ senderId: senderId, receiverId: targetId },
					{ senderId: targetId, receiverId: senderId },
				],
			}).sort({ createdAt: 1 });
		}

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in getMessages controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
export const editMessage = async (req, res) => {
	try {
		const { id: messageId } = req.params;
		const { text } = req.body;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		if (message.senderId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Unauthorized" });
		}

		message.text = text;
		message.isEdited = true;
		await message.save();

		// SOCKET.IO
		const { getIO } = await import("../lib/socket.js");
		const io = getIO();

		const targetId = message.groupId || message.receiverId;
		io.to(targetId.toString()).emit("messageUpdated", message);
		io.to(userId.toString()).emit("messageUpdated", message); // Notify other devices of sender

		res.status(200).json(message);
	} catch (error) {
		console.error("Error in editMessage: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteMessage = async (req, res) => {
	try {
		const { id: messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		if (message.senderId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Unauthorized" });
		}

		await Message.findByIdAndDelete(messageId);

		// SOCKET.IO
		const { getIO } = await import("../lib/socket.js");
		const io = getIO();

		const targetId = message.groupId || message.receiverId;
		io.to(targetId.toString()).emit("messageDeleted", messageId);
		io.to(userId.toString()).emit("messageDeleted", messageId);

		res.status(200).json({ message: "Message deleted" });
	} catch (error) {
		console.error("Error in deleteMessage: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const reactToMessage = async (req, res) => {
	try {
		const { id: messageId } = req.params;
		const { emoji } = req.body;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		// Remove existing reaction from this user if any
		message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());

		// Add new reaction
		if (emoji) {
			message.reactions.push({ userId, emoji });
		}

		await message.save();

		// SOCKET.IO
		const { getIO } = await import("../lib/socket.js");
		const io = getIO();
		const targetId = message.groupId || message.receiverId;
		io.to(targetId.toString()).emit("messageUpdated", message);
		io.to(userId.toString()).emit("messageUpdated", message);

		res.status(200).json(message);
	} catch (error) {
		console.error("Error in reactToMessage: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const pinMessage = async (req, res) => {
	try {
		const { id: messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		message.isPinned = !message.isPinned;
		await message.save();

		// SOCKET.IO
		const { getIO } = await import("../lib/socket.js");
		const io = getIO();
		const targetId = message.groupId || message.receiverId;
		io.to(targetId.toString()).emit("messageUpdated", message);
		io.to(userId.toString()).emit("messageUpdated", message);

		res.status(200).json(message);
	} catch (error) {
		console.error("Error in pinMessage: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};