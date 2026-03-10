import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "../app.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";
import { socketAuthMiddleware } from "../middleware/socket.middleware.js";
import { registerMessageHandlers } from "../handlers/message.handler.js";
import { registerCallHandlers } from "../handlers/call.handler.js";
import { registerTypingHandlers } from "../handlers/typing.handler.js";

dotenv.config();

const server = http.createServer(app);

import { checkOrigin } from "./origin.js";

const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  allowEIO3: true,
});

// --- Scalability: Optional Redis Adapter ---
// Uncomment and configure if using a multi-node environment
/*
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("🚀 Redis adapter initialized for Socket.io scalability");
}).catch(err => {
  console.error("❌ Redis Adapter failed to initialize:", err.message);
});
*/

// Store online users: { userId: Set<socketId> }
const userSocketMap = new Map();

const getReceiverSocketIds = (userId) => userSocketMap.get(userId) || new Set();

const emitCallLogUpdate = async (logId) => {
  try {
    const populatedLog = await CallLog.findById(logId)
      .populate("caller", "username tag profilePic _id")
      .populate("callee", "username tag profilePic _id")
      .lean();

    if (!populatedLog) return;

    const callerId = populatedLog.caller._id.toString();
    const calleeId = populatedLog.callee._id.toString();

    // Use rooms for efficient multi-device support
    io.to(callerId).emit("newCallLog", { ...populatedLog, receiverId: populatedLog.callee });
    io.to(calleeId).emit("newCallLog", { ...populatedLog, receiverId: populatedLog.caller });
  } catch (error) {
    console.error("Error emitting call log update:", error);
  }
};

// --- Middleware: Secure JWT Authentication ---
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  console.log(`✅ User authenticated & connected: ${userId} (${socket.user.username}), Socket: ${socket.id}`);

  // Join a room named after the userId for easy targeting across multi-device sessions
  socket.join(userId);

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  // --- Secure Presence Logic ---
  // 1. Notify only friends that this user is online
  const friends = socket.user.friends || [];
  friends.forEach(friendId => {
    io.to(friendId.toString()).emit("userOnline", userId);
  });

  // 2. Send the user the list of their friends who are currently online
  const onlineFriends = friends.filter(friendId => userSocketMap.has(friendId.toString()));
  socket.emit("getOnlineFriends", onlineFriends);

  // Register Modular Handlers
  registerMessageHandlers(io, socket);
  registerCallHandlers(io, socket, userSocketMap, emitCallLogUpdate);
  registerTypingHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId}, Socket: ${socket.id}`);
    const userSockets = userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        userSocketMap.delete(userId);

        // Notify only friends that this user is now offline
        friends.forEach(friendId => {
          io.to(friendId.toString()).emit("userOffline", userId);
        });
      }
    }
  });

  // Check for undelivered messages on connection
  (async () => {
    try {
      const undeliveredMessages = await Message.find({ receiverId: userId, delivered: false });
      if (undeliveredMessages.length > 0) {
        const senderIds = [...new Set(undeliveredMessages.map(m => m.senderId.toString()))];
        await Message.updateMany({ receiverId: userId, delivered: false }, { $set: { delivered: true } });

        senderIds.forEach(senderId => {
          io.to(senderId).emit("messagesDelivered", { receiverId: userId });
        });
      }
    } catch (error) {
      console.error("Error checking undelivered messages on connection:", error);
    }
  })();
});

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

export { server, io, getReceiverSocketIds, getIO };