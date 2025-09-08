import http from "http";
import { Server } from "socket.io";
import app from "../app.js"; // Assuming app.js exports your express app

// --- HTTP + IO Server Setup ---
const server = http.createServer(app);

// --- CORS Configuration for Socket.IO ---
const allowedOrigins = [
  "http://localhost:5173", // Your local frontend dev port
  "https://genchat-rho.vercel.app", // Your deployed Vercel URL
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman) or from our allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

// --- Online Users Map ---
const userSocketMap = new Map(); // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    console.log(`✅ User connected: ${userId} with socket ID: ${socket.id}`);
    userSocketMap.set(userId, socket.id);

    // Emit the list of online user IDs to all clients
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  }

  socket.on("disconnect", () => {
    // Find which user disconnected
    let disconnectedUserId;
    for (let [id, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = id;
        break;
      }
    }

    if (disconnectedUserId) {
        console.log(`❌ User disconnected: ${disconnectedUserId}`);
        userSocketMap.delete(disconnectedUserId);
        // Emit the updated list of online users
        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    }
  });

  // ... (rest of your event handlers for calls, messages, etc.)
});

export { server, io, userSocketMap };
