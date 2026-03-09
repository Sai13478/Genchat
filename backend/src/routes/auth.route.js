import express from "express";
import { signup, login, logout, checkAuth, updateProfile, refreshToken, logoutAllDevices, updateSettings, getSessions } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

// Protected routes (require a valid JWT)
router.get("/check", protectRoute, checkAuth);
router.post("/logout-all", protectRoute, logoutAllDevices);
router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-settings", protectRoute, updateSettings);
router.get("/sessions", protectRoute, getSessions);

export default router;