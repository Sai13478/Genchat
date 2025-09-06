import dotenv from "dotenv";
import { connectDB as connectToMongoDB } from "./lib/db.js";
import { server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`🚀 Server running on port ${PORT}`);
});