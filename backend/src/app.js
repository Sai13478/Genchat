import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import path from "path";
import passkeyRoutes from "./routes/passkey.route.js";

// Route imports
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import callLogRoutes from "./routes/call.route.js";

dotenv.config();

import { checkOrigin } from "./lib/origin.js";

const app = express();

app.set('trust proxy', 1); // Trust Render's proxy
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());


const corsOptions = {
  origin: checkOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'pragma'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // <-- use the same options here


// ...existing code...
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/v1/users/call-logs", callLogRoutes);
app.use("/api/passkeys", passkeyRoutes);

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