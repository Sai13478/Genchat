import mongoose from "mongoose";
import dotenv from "dotenv";
import Group from "./src/models/group.model.js";
import Conversation from "./src/models/conversation.model.js";
import Message from "./src/models/message.model.js";

dotenv.config();

const cleanup = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for cleanup...");

        const groupsCount = await Group.countDocuments();
        console.log(`Found ${groupsCount} groups to delete.`);

        if (groupsCount > 0) {
            // Delete all groups
            const deleteGroups = await Group.deleteMany({});
            console.log(`Deleted ${deleteGroups.deletedCount} groups.`);

            // Delete group conversations
            const deleteConversations = await Conversation.deleteMany({ isGroup: true });
            console.log(`Deleted ${deleteConversations.deletedCount} group conversations.`);

            // Delete group messages
            const deleteMessages = await Message.deleteMany({ isGroup: true });
            console.log(`Deleted ${deleteMessages.deletedCount} group messages.`);
        }

        console.log("Cleanup completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
};

cleanup();
