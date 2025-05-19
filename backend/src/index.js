import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { connectDB } from './lib/db.js';  // Assuming your db.js handles MongoDB or other DB setup

import authRoutes from './routes/auth.route.js';  // Auth routes
import messageRoutes from './routes/message.route.js';  // Message routes
import { app, server } from './lib/socket.js';  // Socket.IO setup

dotenv.config();  

const PORT = process.env.PORT || 3000;  // Port setup
const __dirname = path.resolve();

// Middleware setup
app.use(express.json({ limit: '10mb' }));  // Limit the body size of incoming requests
app.use(cookieParser());  // To parse cookies
app.use(
  cors({
    origin: 'http://localhost:5173',  // Your frontend URL
    credentials: true,  // Allow credentials for authentication
  })
);

// Define routes
app.use('/api/auth', authRoutes);  // Auth routes
app.use('/api/messages', messageRoutes);  // Message routes

// Serve frontend in production mode
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Catch-all route to serve the frontend's index.html for React SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  connectDB();  // Connect to the database
});
