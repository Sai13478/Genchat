import CallLog from "../models/callLog.model.js";

export const getCallLogs = async (req, res) => {
	try {
		const userId = req.user._id;
		const logs = await CallLog.find({
			$or: [{ caller: userId }, { callee: userId }],
		})
			.populate("caller", "fullName profilePic")
			.populate("callee", "fullName profilePic")
			.sort({ createdAt: -1 });

		res.status(200).json(logs);
	} catch (error) {
		console.error("Error in getCallLogs controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logCall = async (req, res) => {
	try {
		const { caller, callee, callType, status, duration } = req.body;
		const newLog = new CallLog({ caller, callee, callType, status, duration });
		await newLog.save();
		res.status(201).json(newLog);
	} catch (error) {
		console.error("Error in logCall controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};