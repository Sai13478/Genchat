import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./lib/db.js";
import { server } from "./lib/socket.js";

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	connectDB();
	console.log(`🚀 Server running on port ${PORT}`);
});