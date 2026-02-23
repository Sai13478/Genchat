import mongoose from "mongoose";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
// Socket imports will be handled dynamically inside functions to avoid circular dependencies

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

		// 2. Get all conversations for the logged-in user to sort friends by recency
		const conversations = await Conversation.find({
			participants: loggedInUserId,
		}).sort({ updatedAt: -1 });

		// 3. Extract the other participant IDs from these conversations
		const interactedUserIds = conversations.map(conv =>
			conv.participants.find(p => p.toString() !== loggedInUserId.toString())
		).filter(Boolean);

		// 4. Sort the friends: those in interactedUserIds first (maintaining order), then the rest
		const friends = user.friends || [];
		const sortedFriends = [...friends].sort((a, b) => {
			const idA = a._id?.toString();
			const idB = b._id?.toString();

			const indexA = interactedUserIds.indexOf(idA);
			const indexB = interactedUserIds.indexOf(idB);

			if (indexA !== -1 && indexB !== -1) return indexA - indexB;
			if (indexA !== -1) return -1;
			if (indexB !== -1) return 1;

			// Fallback to email or "User" if username is missing (for older users)
			const nameA = a.username || a.email || "User";
			const nameB = b.username || b.email || "User";
			return nameA.localeCompare(nameB);
		});

		// Ensure every friend has a tag and username fallback for the frontend
		const finalFriends = sortedFriends.map(f => ({
			...f.toObject ? f.toObject() : f,
			username: f.username || f.email?.split("@")[0] || "User",
			tag: f.tag || "0000"
		}));

		res.status(200).json(finalFriends);
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
		const { text, image } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			text,
			image: image || "",
			conversationId: conversation._id,
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// Check if receiver is online
		const { getReceiverSocketIds } = await import("../lib/socket.js");
		const receiverSocketIds = getReceiverSocketIds(receiverId);
		if (receiverSocketIds.size > 0) {
			newMessage.delivered = true;
		}

		// this will run in parallel
		await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET.IO - Emit the event to the receiver's room
		const { getIO } = await import("../lib/socket.js");
		const io = getIO();
		io.to(receiverId).emit("newMessage", newMessage);

		res.status(201).json(newMessage);
	} catch (error) {
		console.error("Error in sendMessage controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCES, BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		res.status(200).json(conversation.messages);
	} catch (error) {
		console.error("Error in getMessages controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};