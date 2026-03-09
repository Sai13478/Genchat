import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    createGroup,
    getGroups,
    addMembers,
    removeMember,
    updateGroup,
    manageAdmin
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.post("/add-members", protectRoute, addMembers);
router.post("/remove-member", protectRoute, removeMember);
router.put("/update/:groupId", protectRoute, updateGroup); // New route
router.post("/manage-admin", protectRoute, manageAdmin); // New route

export default router;
