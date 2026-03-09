import express from "express";
import {
    hideConversation,
    unhideConversation,
    toggleArchive,
    getHiddenConversations,
    getArchivedConversations,
} from "../controllers/conversation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/hidden", protectRoute, getHiddenConversations);
router.get("/archived", protectRoute, getArchivedConversations);
router.post("/hide/:conversationId", protectRoute, hideConversation);
router.post("/unhide/:conversationId", protectRoute, unhideConversation);
router.post("/archive/:conversationId", protectRoute, toggleArchive);

export default router;
