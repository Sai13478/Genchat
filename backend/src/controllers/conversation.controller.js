import Conversation from "../models/conversation.model.js";

// POST /conversations/hide/:conversationId
// Body: { secretKey }
export const hideConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { secretKey } = req.body;
        const userId = req.user._id;

        if (!secretKey || secretKey.trim().length < 4) {
            return res.status(400).json({ message: "Secret key must be at least 4 characters." });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found." });

        // Check user is a participant
        if (!conversation.participants.map(String).includes(String(userId))) {
            return res.status(403).json({ message: "Forbidden." });
        }

        // Remove existing entry for this user if any
        conversation.hiddenFor = conversation.hiddenFor.filter(
            (h) => String(h.userId) !== String(userId)
        );

        // Add the new hidden entry
        conversation.hiddenFor.push({ userId, secretKey });
        await conversation.save();

        res.status(200).json({ message: "Conversation hidden successfully." });
    } catch (error) {
        console.error("hideConversation error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// POST /conversations/unhide/:conversationId
// Body: { secretKey }
export const unhideConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { secretKey } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found." });

        const hiddenEntry = conversation.hiddenFor.find(
            (h) => String(h.userId) === String(userId)
        );

        if (!hiddenEntry) {
            return res.status(400).json({ message: "This conversation is not hidden for you." });
        }

        if (hiddenEntry.secretKey !== secretKey) {
            return res.status(401).json({ message: "Incorrect secret key." });
        }

        // Remove from hiddenFor
        conversation.hiddenFor = conversation.hiddenFor.filter(
            (h) => String(h.userId) !== String(userId)
        );
        await conversation.save();

        res.status(200).json({ message: "Conversation unlocked." });
    } catch (error) {
        console.error("unhideConversation error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// POST /conversations/archive/:conversationId
export const toggleArchive = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found." });

        if (!conversation.participants.map(String).includes(String(userId))) {
            return res.status(403).json({ message: "Forbidden." });
        }

        const isArchived = conversation.archivedFor.map(String).includes(String(userId));

        if (isArchived) {
            conversation.archivedFor = conversation.archivedFor.filter(
                (id) => String(id) !== String(userId)
            );
        } else {
            conversation.archivedFor.push(userId);
        }

        await conversation.save();
        res.status(200).json({ archived: !isArchived, message: !isArchived ? "Conversation archived." : "Conversation unarchived." });
    } catch (error) {
        console.error("toggleArchive error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// GET /conversations/hidden - Get the user's hidden conversations (for unlocked session display)
export const getHiddenConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            "hiddenFor.userId": userId,
        }).populate("participants", "username profilePic tag").lean();

        res.status(200).json(conversations);
    } catch (error) {
        console.error("getHiddenConversations error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// GET /conversations/archived
export const getArchivedConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            archivedFor: userId,
        }).populate("participants", "username profilePic tag").lean();

        res.status(200).json(conversations);
    } catch (error) {
        console.error("getArchivedConversations error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
