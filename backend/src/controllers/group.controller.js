import Group from "../models/group.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const createGroup = async (req, res) => {
    try {
        const { name, description, members } = req.body;
        const adminId = req.user._id;

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        // Ensure admin is included in members
        const groupMembers = [...new Set([...members, adminId.toString()])];

        const newGroup = new Group({
            name,
            description: description || "",
            admins: [adminId], // Changed to admins array
            members: groupMembers,
        });

        await newGroup.save();

        // Create a corresponding conversation
        const conversation = new Conversation({
            participants: groupMembers,
            isGroup: true,
            groupId: newGroup._id,
        });

        await conversation.save();

        res.status(201).json(newGroup);
    } catch (error) {
        console.error("Error in createGroup: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId }).populate("admins", "username profilePic");
        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getGroups: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, image } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        const isAdmin = group.admins.some(id => id.toString() === userId.toString());

        // Check if user is an admin or if everyone can edit
        if (group.settings?.editGroupInfo && !isAdmin) {
            return res.status(403).json({ error: "Only admins can update group details" });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (image) group.image = image;

        // Handle settings updates (only admins can change settings)
        if (req.body.settings && isAdmin) {
            group.settings = { ...group.settings, ...req.body.settings };
        }

        await group.save();
        res.status(200).json(group);
    } catch (error) {
        console.error("Error in updateGroup: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const manageAdmin = async (req, res) => {
    try {
        const { groupId, memberId, action } = req.body; // action: 'promote' or 'demote'
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        if (!group.admins.some(id => id.toString() === userId.toString())) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (action === "promote") {
            if (!group.admins.some(id => id.toString() === memberId.toString())) {
                group.admins.push(memberId);
            }
        } else if (action === "demote") {
            // Cannot demote the last admin
            if (group.admins.length <= 1) {
                return res.status(400).json({ error: "Cannot demote the last admin" });
            }
            group.admins = group.admins.filter((id) => id.toString() !== memberId);
        }

        await group.save();
        res.status(200).json(group);
    } catch (error) {
        console.error("Error in manageAdmin: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addMembers = async (req, res) => {
    try {
        const { groupId, membersToAdd } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        if (!group.admins.some(id => id.toString() === userId.toString())) {
            return res.status(403).json({ error: "Only admins can add members" });
        }

        group.members = [...new Set([...group.members, ...membersToAdd])];
        await group.save();

        // Update conversation participants
        await Conversation.findOneAndUpdate(
            { groupId: group._id },
            { $addToSet: { participants: { $each: membersToAdd } } }
        );

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in addMembers: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { groupId, memberToRemove } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        // Admin can remove anyone, or a member can leave themselves
        const isSelf = userId.toString() === memberToRemove.toString();
        const isAdmin = group.admins.some(id => id.toString() === userId.toString());

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Ensure we don't try to remove something that's not there
        const memberToRemoveStr = memberToRemove.toString();

        // If admin is leaving, ensure there's another admin
        if (isAdmin && isSelf && group.admins.length <= 1 && group.members.length > 1) {
            return res.status(400).json({ error: "Promote someone else to admin before leaving" });
        }

        group.members = group.members.filter((m) => m.toString() !== memberToRemove);
        group.admins = group.admins.filter((a) => a.toString() !== memberToRemove);

        await group.save();

        // Update conversation participants
        await Conversation.findOneAndUpdate(
            { groupId: group._id },
            { $pull: { participants: memberToRemove } }
        );

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in removeMember: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
