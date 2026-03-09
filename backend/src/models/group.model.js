import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        settings: {
            editGroupInfo: {
                type: Boolean,
                default: false, // false = Everyone, true = Admins Only
            },
            sendMessages: {
                type: Boolean,
                default: false, // false = Everyone, true = Admins Only
            },
        },
    },
    { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
