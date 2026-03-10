import User from "../models/user.model.js";
import CallLog from "../models/callLog.model.js";

export const registerCallHandlers = (io, socket, userSocketMap, emitCallLogUpdate) => {
    const userId = socket.user._id.toString();

    socket.on("call-user", async ({ to, offer, callType }) => {
        if (userSocketMap.has(to)) {
            try {
                console.log(`[${new Date().toISOString()}] Relaying call from ${userId} to ${to}`);
                const callerUser = await User.findById(userId).select("username tag profilePic _id");

                const newLog = new CallLog({ caller: userId, callee: to, callType, status: 'missed' });
                await newLog.save();

                const callId = newLog._id.toString();
                socket.emit("call-initiated", { callId });

                io.to(to).emit("incoming-call", { from: callerUser, offer, callId, callType });

                emitCallLogUpdate(callId);
            } catch (error) {
                console.error("Error creating call log:", error.message);
                socket.emit("call-failed", { message: "Could not initiate call.", reason: error.message });
            }
        } else {
            console.log(`[${new Date().toISOString()}] User ${to} is offline, notifying caller ${userId}`);
            socket.emit("user-offline", { userId: to });
        }
    });

    socket.on("answer-call", ({ to, answer, callId }) => {
        console.log(`[${new Date().toISOString()}] Relaying answer for ${callId} from ${userId} to ${to}`);
        io.to(to).emit("call-accepted", { from: userId, answer, callId });
        socket.to(userId).emit("call-answered-elsewhere", { callId });
    });

    socket.on("decline-call", async ({ to, callId }) => {
        console.log(`[${new Date().toISOString()}] Relaying decline for ${callId} from ${userId} to ${to}`);
        try {
            await CallLog.findByIdAndUpdate(callId, { status: "declined" });
            emitCallLogUpdate(callId);
        } catch (error) {
            console.error("Error updating call log to declined:", error);
        }
        io.to(to).emit("call-declined", { from: userId, callId });
        socket.to(userId).emit("call-declined-elsewhere", { callId });
    });

    socket.on("hangup", async ({ to, callId }) => {
        try {
            const call = await CallLog.findById(callId);
            if (call && call.status === "missed") {
                const duration = Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 1000);
                await CallLog.findByIdAndUpdate(callId, { status: "answered", duration });
                emitCallLogUpdate(callId);
            }
        } catch (error) {
            console.error("Error updating call log on hangup:", error);
        }
        console.log(`[${new Date().toISOString()}] Relaying hangup for ${callId} from ${userId} to ${to}`);
        io.to(to).emit("hangup", { from: userId, callId });
    });

    socket.on("renegotiate-call", ({ to, offer, callId }) => {
        io.to(to).emit("renegotiate-call", { from: userId, offer, callId });
    });

    socket.on("ice-candidate", ({ to, candidate, callId }) => {
        io.to(to).emit("ice-candidate", { from: userId, candidate, callId });
    });
};
