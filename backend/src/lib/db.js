import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://saipramodvedantam:cFsFJ37viwgHdMec@cluster0.rtwqnkw.mongodb.net/rc_a?retryWrites=true&w=majority&appName=Cluster0");
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};