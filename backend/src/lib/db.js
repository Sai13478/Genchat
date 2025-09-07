import mongoose from "mongoose";

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`MongoDB: ${collectionName}.${method}`, JSON.stringify(query), doc || '');
  });
}

// Cache the database connection to prevent multiple connections
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  console.log('prnt env', process.env.MONGO_URI);
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  // If we have a cached connection in development, use it
  if (cached.conn) {
    console.log('Using existing MongoDB connection');
    return cached.conn;
  }

  try {
    // Create a new connection if one doesn't exist
    if (!cached.promise) {
      const opts = {
        bufferCommands: false, // Disable mongoose buffering
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds socket timeout
      };

      console.log('Connecting to MongoDB...');
      cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
        .then((mongoose) => {
          console.log(`MongoDB connected: ${mongoose.connection.host}`);
          return mongoose;
        });
    }

    // Wait for the connection to be established
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      stack: error.stack
    });
    
    // In case of error, clear the cached promise to allow retries
    cached.promise = null;
    
    // Rethrow the error to be handled by the application
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);  
  if (err.message && err.message.match(/failed to connect to server/)) {
    console.error('Please check if MongoDB is running and accessible');
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');  
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});