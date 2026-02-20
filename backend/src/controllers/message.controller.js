import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		// 1. Get all conversations for the logged-in user, sorted by most recent first
		const conversations = await Conversation.find({
			participants: loggedInUserId,
		}).sort({ updatedAt: -1 });

		// 2. Extract the other participant IDs from these conversations (in order)
		const interactedUserIds = conversations.map(conv =>
			conv.participants.find(p => p.toString() !== loggedInUserId.toString())
		).filter(Boolean);

		// 3. Get all users except the logged-in one
		const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		// 4. Sort the users: those in interactedUserIds first (maintaining order), then the rest
		const sortedUsers = [...allUsers].sort((a, b) => {
			const indexA = interactedUserIds.indexOf(a._id.toString());
			const indexB = interactedUserIds.indexOf(b._id.toString());

			// If both have interactions, sort by their position in interactedUserIds (recency)
			if (indexA !== -1 && indexB !== -1) return indexA - indexB;
			// If only one has interaction, put it first
			if (indexA !== -1) return -1;
			if (indexB !== -1) return 1;
			// If neither has interactions, maintain alphabetical or original order
			return a.fullName.localeCompare(b.fullName);
		});

		res.status(200).json(sortedUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error);
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