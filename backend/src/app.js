import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "./lib/passport.js";
import passkeyRoutes from "./routes/passkey.route.js";

// Route imports
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import callLogRoutes from "./routes/call.route.js";
import conversationRoutes from "./routes/conversation.route.js";

dotenv.config();

import { checkOrigin } from "./lib/origin.js";

const app = express();

app.set('trust proxy', 1); // Trust Render's proxy

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CMS for now to avoid issues with inline icons/styles
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Relaxed for testing (was 100)
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Relaxed for testing (was 5)
  message: { error: "Too many authentication attempts, please try again after a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// CSRF Protection Middleware: Enforce custom header for state-changing requests
app.use((req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (!safeMethods.includes(req.method)) {
    const customHeader = req.headers["x-genchat-requested-with"];
    if (customHeader !== "XMLHttpRequest") {
      console.warn(`🛑 CSRF Attempt blocked: Missing/Invalid Header. Method: ${req.method}, Path: ${req.path}`);
      return res.status(403).json({ error: "Security Policy Violation: CSRF Protection" });
    }
  }
  next();
});

app.use(express.json({ limit: "1mb" })); // Reduced from 50mb for security
app.use(cookieParser());
app.use(passport.initialize());


const corsOptions = {
  origin: checkOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'pragma', 'x-genchat-requested-with'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // <-- use the same options here


// ...existing code...
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/v1/users/call-logs", callLogRoutes);
app.use("/api/passkeys", passkeyRoutes);
app.use("/api/conversations", conversationRoutes);

const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

export default app;