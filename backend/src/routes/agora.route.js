import express from "express";
import { getAgoraToken } from "../controllers/agora.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected: Generate a temporary Agora token for a call channel
router.get("/token", protectRoute, getAgoraToken);

export default router;
