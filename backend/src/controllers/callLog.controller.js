import CallLog from "../models/callLog.model.js";

export const getAllCallLogs = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all call logs where the current user is either the caller or the callee
    const logs = await CallLog.find({
      $or: [{ caller: userId }, { callee: userId }],
    })
      .populate("caller", "username tag profilePic _id")
      .populate("callee", "username tag profilePic _id")
      .sort({ createdAt: -1 }) // Show most recent calls first
      .lean(); // Use .lean() for better performance as we only need plain JS objects

    // The frontend needs to easily identify the "other" person in the call.
    // We'll process the logs to add a 'receiverId' field which contains the other user's info.
    const processedLogs = logs.map((log) => {
      let receiverId;
      // If the current user was the caller, the receiver is the callee
      if (log.caller._id.toString() === userId.toString()) {
        receiverId = log.callee;
      } else {
        // Otherwise, the receiver is the caller
        receiverId = log.caller;
      }
      return { ...log, receiverId };
    });

    res.status(200).json(processedLogs);
  } catch (error) {
    console.error("Error in getAllCallLogs controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};