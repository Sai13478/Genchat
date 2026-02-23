import express from "express";
import {
    getUsersForSidebar,
    sendMessage,
    getMessages,
    searchUser,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// This route MUST be protected to know who the current user is
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUser);
router.get("/friend-requests", protectRoute, getFriendRequests);
router.post("/friend-request/accept", protectRoute, acceptFriendRequest);
router.post("/friend-request/reject", protectRoute, rejectFriendRequest);
router.post("/friend-request/:id", protectRoute, sendFriendRequest);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

export default router;