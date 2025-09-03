import express from "express";
import { getCallLogs, logCall } from "../controllers/call.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCallLogs);
router.post("/log", protectRoute, logCall);

export default router;