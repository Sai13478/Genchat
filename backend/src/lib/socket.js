import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "../app.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";

dotenv.config();

const server = http.createServer(app);

import { checkOrigin } from "./origin.js";

// ...existing code...

const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  allowEIO3: true,
});


// Store online users in a mapping: { userId: Set<socketId> }
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

    const logForCaller = { ...populatedLog, receiverId: populatedLog.callee };
    io.to(callerId).emit("newCallLog", logForCaller);

    const logForCallee = { ...populatedLog, receiverId: populatedLog.caller };
    io.to(calleeId).emit("newCallLog", logForCallee);
  } catch (error) {
    console.error("Error emitting call log update:", error);
  }
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId?.toString();
  if (!userId) {
    console.warn("⚠️ Connection attempt without userId. Socket:", socket.id);
    return;
  }

  console.log(`✅ User connected: ${userId}, Socket: ${socket.id}`);

  socket.join(userId);

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId}, Socket: ${socket.id}`);
    const userSockets = userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        userSocketMap.delete(userId);
      }
    }
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });

  // --- Call Signaling Lifecycle ---

  // Initiate: Relay offer from caller to callee's room
  socket.on("call-user", async ({ to, offer, callType }) => {
    if (userSocketMap.has(to)) {
      try {
        console.log(`[${new Date().toISOString()}] Relaying call from ${userId} to ${to}`);
        const callerUser = await User.findById(userId).select("username tag profilePic _id");

        const newLog = new CallLog({ caller: userId, callee: to, callType, status: 'missed' });
        await newLog.save();

        const callId = newLog._id.toString();

        io.to(to).emit("incoming-call", { from: callerUser, offer, callId, callType });

        emitCallLogUpdate(callId);

      } catch (error) {
        console.error("Error creating call log:", error.message);
        socket.emit("call-failed", { message: "Could not initiate call.", reason: error.message });
      }
    } else {
      console.log(`[${new Date().toISOString()}] User ${to} is offline, notifying caller ${userId}`);
      socket.emit("user-offline", { userId: to });
    }
  });

  // Accept: Relay answer from callee to caller's room
  socket.on("answer-call", ({ to, answer, callId }) => {
    console.log(`[${new Date().toISOString()}] Relaying answer for ${callId} from ${userId} to ${to}`);
    io.to(to).emit("call-accepted", { from: userId, answer, callId });

    // Notify other devices of the same user that the call was answered elsewhere
    socket.to(userId).emit("call-answered-elsewhere", { callId });
  });

  // Decline: Relay decline from callee to caller's room
  socket.on("decline-call", async ({ to, callId }) => {
    console.log(`[${new Date().toISOString()}] Relaying decline for ${callId} from ${userId} to ${to}`);
    try {
      await CallLog.findByIdAndUpdate(callId, { status: "declined" });
      emitCallLogUpdate(callId);
    } catch (error) {
      console.error("Error updating call log to declined:", error);
    }
    io.to(to).emit("call-declined", { from: userId, callId });

    // Notify other devices of the same user that the call was declined elsewhere
    socket.to(userId).emit("call-declined-elsewhere", { callId });
  });

  // Hangup: Relay hangup to other peer's room
  socket.on("hangup", async ({ to, callId }) => {
    try {
      const call = await CallLog.findById(callId);
      if (call && call.status === "missed") {
        const duration = Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 1000);
        await CallLog.findByIdAndUpdate(callId, { status: "answered", duration });
        emitCallLogUpdate(callId);
      }
    } catch (error) {
      console.error("Error updating call log on hangup:", error);
    }
    console.log(`[${new Date().toISOString()}] Relaying hangup for ${callId} from ${userId} to ${to}`);
    io.to(to).emit("hangup", { from: userId, callId });
  });

  // Renegotiate: Handle track updates (like screen share) during an active call
  socket.on("renegotiate-call", ({ to, offer, callId }) => {
    console.log(`[${new Date().toISOString()}] Relaying re-negotiation for ${callId} from ${userId} to ${to}`);
    io.to(to).emit("renegotiate-call", { from: userId, offer, callId });
  });

  // ICE Candidate: Relay ICE candidates between peers
  socket.on("ice-candidate", ({ to, candidate, callId }) => {
    io.to(to).emit("ice-candidate", { from: userId, candidate, callId });
  });

  // --- Typing Indicator ---
  socket.on("typing", ({ to }) => {
    io.to(to).emit("typing", { from: userId });
  });

  socket.on("stop-typing", ({ to }) => {
    io.to(to).emit("stop-typing", { from: userId });
  });

  // --- Chat Features ---
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

  // Check for undelivered messages and notify senders
  (async () => {
    try {
      const undeliveredMessages = await Message.find({ receiverId: userId, delivered: false });
      if (undeliveredMessages.length > 0) {
        // Group by sender to emit efficiently
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
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export { server, io, getReceiverSocketIds, getIO };