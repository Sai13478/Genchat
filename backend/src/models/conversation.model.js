import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		isGroup: {
			type: Boolean,
			default: false,
		},
		groupId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Group",
		},
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
		hiddenFor: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				secretKey: { type: String },
			},
		],
		archivedFor: [
			{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
		],
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;