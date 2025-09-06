import express from "express";
import { getAllCallLogs } from "../controllers/callLog.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// This is the single, correct endpoint to fetch all call logs for the authenticated user.
router.get("/", protectRoute, getAllCallLogs);

export default router;
