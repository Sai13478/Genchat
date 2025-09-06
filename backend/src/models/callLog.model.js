import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  callee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  callType: { type: String, enum: ["audio", "video"], required: true }, // <-- must be "audio" or "video"
  status: { type: String, enum: ["missed", "answered", "declined"], default: "missed" },
  duration: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("CallLog", callLogSchema);