// socket.js
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import app from "../app.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";

dotenv.config();

// ---------- HTTP + IO Server ----------
const server = http.createServer(app);

// Allow only these frontends
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://genchat-rho.vercel.app/",
];

if (process.env.FRONTEND_URLS) {
  const frontendUrls = process.env.FRONTEND_URLS
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  allowedOrigins.push(...frontendUrls);
}

// remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

const io = new Server(server, {
  cors: {
    // check the Origin dynamically
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow tools / server-side
      if (uniqueOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
});

// ---------- Online Users ----------
const userSocketMap = new Map(); // { userId: Set<socketId> }
const getReceiverSocketIds = (userId) => userSocketMap.get(userId) || new Set();

// ---------- Utility ----------
const emitCallLogUpdate = async (logId) => {
  try {
    const populatedLog = await CallLog.findById(logId)
      .populate("caller", "fullName profilePic _id")
      .populate("callee", "fullName profilePic _id")
      .lean();

    if (!populatedLog) return;

    const callerId = populatedLog.caller._id.toString();
    const calleeId = populatedLog.callee._id.toString();

    io.to(callerId).emit("newCallLog", { ...populatedLog, receiverId: populatedLog.callee });
    io.to(calleeId).emit("newCallLog", { ...populatedLog, receiverId: populatedLog.caller });
  } catch (err) {
    console.error("Error emitting call log:", err);
  }
};

// ---------- Socket.IO Handlers ----------
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId?.toString();
  if (!userId) {
    console.warn("⚠️ connection attempt without userId");
    return;
  }

  console.log(`✅ connected: ${userId} (${socket.id})`);

  socket.join(userId);
  if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
  userSocketMap.get(userId).add(socket.id);

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log(`❌ disconnected: ${userId} (${socket.id})`);
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) userSocketMap.delete(userId);
    }
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });

  // ---- Call Signaling ----
  socket.on("call-user", async ({ to, offer, callType }) => {
    if (!userSocketMap.has(to)) {
      socket.emit("user-offline", { userId: to });
      return;
    }
    try {
      const callerUser = await User.findById(userId).select("fullName profilePic _id");
      const newLog = new CallLog({ caller: userId, callee: to, callType, status: "missed" });
      await newLog.save();

      io.to(to).emit("incoming-call", {
        from: callerUser,
        offer,
        callId: newLog._id.toString(),
        callType,
      });

      emitCallLogUpdate(newLog._id);
    } catch (err) {
      console.error("call-user error:", err.message);
      socket.emit("call-failed", { message: "Could not initiate call", reason: err.message });
    }
  });

  socket.on("answer-call", ({ to, answer, callId }) => {
    io.to(to).emit("call-accepted", { from: userId, answer, callId });
  });

  socket.on("decline-call", async ({ to, callId }) => {
    try {
      await CallLog.findByIdAndUpdate(callId, { status: "declined" });
      emitCallLogUpdate(callId);
    } catch (err) {
      console.error("decline-call error:", err);
    }
    io.to(to).emit("call-declined", { from: userId, callId });
  });

  socket.on("hangup", async ({ to, callId }) => {
    try {
      const call = await CallLog.findById(callId);
      if (call && call.status === "missed") {
        const duration = Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 1000);
        await CallLog.findByIdAndUpdate(callId, { status: "answered", duration });
        emitCallLogUpdate(callId);
      }
    } catch (err) {
      console.error("hangup error:", err);
    }
    io.to(to).emit("hangup", { from: userId, callId });
  });

  socket.on("ice-candidate", ({ to, candidate, callId }) => {
    io.to(to).emit("ice-candidate", { from: userId, candidate, callId });
  });

  // ---- Typing ----
  socket.on("typing", ({ to }) => io.to(to).emit("typing", { from: userId }));
  socket.on("stop-typing", ({ to }) => io.to(to).emit("stop-typing", { from: userId }));

  // ---- Chat ----
  socket.on("markMessagesAsSeen", async ({ conversationId, userIdOfSender }) => {
    try {
      await Message.updateMany(
        { conversationId, seen: false, senderId: userIdOfSender },
        { $set: { seen: true } }
      );
      io.to(userIdOfSender).emit("messagesSeen", { conversationId });
    } catch (err) {
      console.error("markMessagesAsSeen error:", err);
    }
  });
});

export { server, io, getReceiverSocketIds };
