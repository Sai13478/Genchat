import Message from "../models/message.model.js";

export const registerMessageHandlers = (io, socket) => {
    const userId = socket.user._id.toString();

    socket.on("markMessagesAsSeen", async ({ conversationId, userIdOfSender }) => {
        try {
            await Message.updateMany(
                { conversationId: conversationId, seen: false, senderId: userIdOfSender },
                { $set: { seen: true } }
            );
            io.to(userIdOfSender).emit("messagesSeen", { conversationId });
        } catch (error) {
            console.error("Error marking messages as seen:", error);
        }
    });

    socket.on("markMessagesAsDelivered", async ({ conversationId, userIdOfSender }) => {
        try {
            await Message.updateMany(
                { conversationId: conversationId, delivered: false, senderId: userIdOfSender },
                { $set: { delivered: true } }
            );
            io.to(userIdOfSender).emit("messagesDelivered", { conversationId });
        } catch (error) {
            console.error("Error marking messages as delivered:", error);
        }
    });
};
