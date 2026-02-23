import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { io } from "../lib/socket.js";

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

export const addFriend = async (req, res) => {
	try {
		const { friendId } = req.body;
		const loggedInUserId = req.user._id;

		if (friendId === loggedInUserId.toString()) {
			return res.status(400).json({ error: "You cannot add yourself as a friend" });
		}

		const user = await User.findById(loggedInUserId);
		const friend = await User.findById(friendId);

		if (!friend) {
			return res.status(404).json({ error: "Friend user not found" });
		}

		if (user.friends.some(id => id.toString() === friendId)) {
			return res.status(400).json({ error: "User is already your friend" });
		}

		user.friends.push(friendId);
		friend.friends.push(loggedInUserId);

		await Promise.all([user.save(), friend.save()]);

		res.status(200).json({ message: "Friend added successfully", friend: { _id: friend._id, username: friend.username, tag: friend.tag, profilePic: friend.profilePic } });
	} catch (error) {
		console.error("Error in addFriend: ", error);
		res.status(500).json({ error: "Internal server error" });
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