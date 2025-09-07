import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import passkeyRoutes from "./routes/passkey.route.js";

// Route imports
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import callLogRoutes from "./routes/call.route.js";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Configure allowed origins based on environment
const allowedOrigins = [
  '*',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://genchat-klywzxp8g-sai13478s-projects.vercel.app',
];

if (process.env.FRONTEND_URLS) {
  const frontendUrls = process.env.FRONTEND_URLS.split(',').map(url => url.trim());
  allowedOrigins.push(...frontendUrls);
}

const validOrigins = [...new Set(allowedOrigins.filter(Boolean))];
console.log('Allowed CORS origins:', validOrigins);


// ...existing code...

const corsOptions = {
  origin: validOrigins,
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

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

export default app;