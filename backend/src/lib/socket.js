import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import User from "../models/user.model.js";
import Message from "../models/message.model.js"; // <-- Import the Message model
import CallLog from "../models/callLog.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json({ limit: "50mb" })); // To parse JSON payloads from req.body
app.use(cookieParser()); // To parse cookies from req.cookies

// Configure allowed origins based on environment
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://l9vk18ms-5173.inc1.devtunnels.ms/',
];

// Add any additional frontend URLs from the environment variables
if (process.env.FRONTEND_URLS) {
  const frontendUrls = process.env.FRONTEND_URLS.split(',').map(url => url.trim());
  allowedOrigins.push(...frontendUrls);
}

// Remove any undefined or empty origins and deduplicate
const validOrigins = [...new Set(allowedOrigins.filter(Boolean))];
console.log('Allowed CORS origins:', validOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (validOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

const io = new Server(server, {
  cors: {
    origin: validOrigins, // Use the same dynamic origins list
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  // Enable compatibility with older Socket.IO clients if needed
  allowEIO3: true,
});

// Store online users in a mapping: { userId: Set<socketId> }
// This correctly handles multiple tabs/devices for a single user.
const userSocketMap = new Map();

// Helper function to get all socket IDs for a given user ID
const getReceiverSocketIds = (userId) => userSocketMap.get(userId) || new Set();

// Handle socket connection
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId?.toString();
  if (!userId) {
    console.warn("⚠️ Connection attempt without userId. Socket:", socket.id);
    return;
  }

  console.log(`✅ User connected: ${userId}, Socket: ${socket.id}`);

  // Join a room identified by the userId. All sockets for this user will be in this room.
  socket.join(userId);

  // Add the new socket to our map
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  // Emit the updated list of online users (only unique user IDs)
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId}, Socket: ${socket.id}`);
    const userSockets = userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      // If the user has no more active sockets, remove them from the map
      if (userSockets.size === 0) {
        userSocketMap.delete(userId);
      }
    }
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });

  // --- Call Signaling Lifecycle ---

  // Initiate: Relay offer from caller to callee's room
  socket.on("call-user", async ({ to, offer, callId, callType }) => {
    if (userSocketMap.has(to)) {
      console.log(`[${new Date().toISOString()}] Relaying call ${callId} from ${userId} to ${to}`);
      // Fetch the caller's user object to send to the callee for a better UI experience
      const callerUser = await User.findById(userId).select("fullName profilePic _id");

      // Log the initial call attempt as 'missed'. This will be updated if answered/declined.
      const newLog = new CallLog({ caller: userId, callee: to, callType, status: 'missed' });
      await newLog.save();

      // Attach the new log's ID to the event payload
      callId = newLog._id.toString();

      // Emit to the user's room, will notify all their connected clients
      io.to(to).emit("incoming-call", { from: callerUser, offer, callId, callType });
    } else {
      console.log(`[${new Date().toISOString()}] User ${to} is offline, notifying caller ${userId}`);
      socket.emit("user-offline", { userId: to, callId });
    }
  });

  // Accept: Relay answer from callee to caller's room
  socket.on("answer-call", ({ to, answer, callId }) => {
    console.log(`[${new Date().toISOString()}] Relaying answer for ${callId} from ${userId} to ${to}`);
    io.to(to).emit("call-accepted", { from: userId, answer, callId });
  });

  // Decline: Relay decline from callee to caller's room
  socket.on("decline-call", async ({ to, callId }) => {
    console.log(`[${new Date().toISOString()}] Relaying decline for ${callId} from ${userId} to ${to}`);
    try {
      await CallLog.findByIdAndUpdate(callId, { status: 'declined' });
    } catch (error) {
      console.error("Error updating call log to declined:", error);
    }
    io.to(to).emit("call-declined", { from: userId, callId });
  });

  // Hangup: Relay hangup to other peer's room
  socket.on("hangup", async ({ to, callId }) => {
    try {
      await CallLog.findByIdAndUpdate(callId, { status: 'answered', duration: Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 1000) });
    } catch (error) {
      // This part needs improvement to get the start time. For now, we just hang up.
    }
    console.log(`[${new Date().toISOString()}] Relaying hangup for ${callId} from ${userId} to ${to}`);
    io.to(to).emit("hangup", { from: userId, callId });
  });

  // ICE Candidate: Relay ICE candidates between peers
  socket.on("ice-candidate", ({ to, candidate, callId }) => {
    // This event is high-frequency, so we can use a more verbose log level if desired
    // console.debug(`[${new Date().toISOString()}] Relaying ICE for ${callId} from ${userId} to ${to}`);
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
      // Notify the sender that their messages have been seen
      io.to(userIdOfSender).emit("messagesSeen", { conversationId });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });

});

// Add request logging middleware
app.use((req, res, next) => {
	const timestamp = new Date().toISOString();
	// Log the body only if it's not empty
	const bodyLog = Object.keys(req.body || {}).length > 0 ? `\nRequest Body: ${JSON.stringify(req.body, null, 2)}` : '';
	console.log(`[${timestamp}] ${req.method} ${req.url}${bodyLog}`);
	next();
});

// Handle server errors with more context
server.on('error', (error) => {
  if (error.syscall !== 'listen') throw error;
  
  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
  
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle uncaught exceptions with graceful shutdown
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  // Attempt a graceful shutdown
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
  // Force close the server after 5 seconds
  setTimeout(() => process.exit(1), 5000).unref();
});

// Handle unhandled promise rejections with more context
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
const startServer = () => {
  return new Promise((resolve) => {
    server.listen(PORT, () => {
      const address = server.address();
      const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + address.port;
      
      console.log(`\n[${new Date().toISOString()}] 🚀 Server started`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.IO running on ${bind}`);
      console.log(`🩺 Health check available at http://localhost:${PORT}/health\n`);
      
      resolve(server);
    });
  });
};

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`\n[${new Date().toISOString()}] ${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();
};

// Listen for shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server if this file is run directly
const isRunDirectly = import.meta.url === `file://${process.argv[1]}`;

if (isRunDirectly) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app, server, io, getReceiverSocketIds, startServer };
