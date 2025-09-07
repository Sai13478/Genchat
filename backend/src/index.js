import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	connectDB();
	console.log(`🚀 Server running on port ${PORT}`);
});