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

// Body parser & cookie parser
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// ---------- CORS CONFIG ----------
const allowedOrigins = [
  "*",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://genchat-rho.vercel.app",
  "https://genchat-b23lbalkm-sai13478s-projects.vercel.app",
];

if (process.env.FRONTEND_URLS) {
  const urls = process.env.FRONTEND_URLS.split(",").map((url) => url.trim());
  allowedOrigins.push(...urls);
}

const validOrigins = [...new Set(allowedOrigins)];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || validOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // <-- important for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "cache-control", "pragma"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

// ---------- API ROUTES ----------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/v1/users/call-logs", callLogRoutes);
app.use("/api/passkeys", passkeyRoutes);

// ---------- HEALTH CHECK ----------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

export default app;
