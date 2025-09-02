import express from "express";
import { getUsersForSidebar, sendMessage, getMessages } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// This route MUST be protected to know who the current user is
router.get("/conversations", protectRoute, getUsersForSidebar);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

export default router;