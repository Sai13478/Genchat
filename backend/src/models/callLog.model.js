import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
	{
		caller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		callee: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		callType: {
			type: String,
			enum: ["audio", "video"],
			required: true,
		},
		status: {
			type: String,
			enum: ["answered", "declined", "missed"],
			required: true,
		},
		duration: { type: Number, default: 0 }, // in seconds
	},
	{ timestamps: true }
);

const CallLog = mongoose.model("CallLog", callLogSchema);

export default CallLog;