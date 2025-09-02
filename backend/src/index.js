import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import { app, startServer } from './lib/socket.js';
import callRoutes from './routes/call.route.js';



dotenv.config();

const __dirname = path.resolve();

// Mount API routes. The core middleware (cors, json, cookieParser) is already in socket.js
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Serve static files from the frontend build directory in production
if (process.env.NODE_ENV === 'production') {
  // Assuming this script is run from the `backend` directory
  const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendDistPath, 'index.html'));
  });
}
app.use("/api/calls", callRoutes);
// Start the server only after the database connection is established
connectDB().then(() => {
  startServer();
}).catch(err => {
  console.error('🔴 Failed to start server due to DB connection error:', err);
  process.exit(1);
});
