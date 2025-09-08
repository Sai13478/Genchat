import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import passkeyRoutes from "./routes/passkey.route.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import callLogRoutes from "./routes/call.route.js";

dotenv.config();

const app = express();

// Parse JSON and cookies
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// -----------------------------
// CORS Configuration
// -----------------------------

// Default allowed origins (local dev + prod example)
let allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://genchat-rho.vercel.app", // primary prod
];

// Add additional frontend URLs from .env if provided
if (process.env.FRONTEND_URLS) {
  const frontendUrls = process.env.FRONTEND_URLS
    .split(",")
    .map(url => url.trim())
    .filter(Boolean);
  allowedOrigins.push(...frontendUrls);
}

// Remove duplicates
allowedOrigins = [...new Set(allowedOrigins)];
console.log("Allowed CORS origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // important for cookies / sessions
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "cache-control", "pragma"],
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// -----------------------------
// API Routes
// -----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/v1/users/call-logs", callLogRoutes);
app.use("/api/passkeys", passkeyRoutes);

// -----------------------------
// Health check
// -----------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

export default app;
