import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient.js";
import { useCallLogStore } from "../store/useCallLogStore.js";
import { Clock, Phone, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuthStore } from "../store/useAuthStore.js";

// Helper function to format duration from seconds to MM:SS format
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return null; // Return null if duration is not available
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};


const CallLogsPage = () => {
    const { callLogs, setCallLogs, addCallLog } = useCallLogStore();
    const { authUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const { socket } = useSocket();

    // Effect to fetch initial call logs
    useEffect(() => {
        const getCallLogs = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get("/v1/users/call-logs");
                // Sort logs by date, newest first, on the client-side as a safeguard
                const sortedLogs = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setCallLogs(sortedLogs);
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to fetch call logs");
            } finally {
                setLoading(false);
            }
        };

        getCallLogs();
    }, [location, setCallLogs]);

    // Effect to listen for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNewCallLog = (log) => {
            addCallLog(log);
        };

        socket.on("newCallLog", handleNewCallLog);

        return () => socket.off("newCallLog", handleNewCallLog);
    }, [socket, addCallLog]);

    return (
        <div className='flex flex-col h-full bg-base-100/50 w-full overflow-hidden'>
            <div className='bg-base-100/60 backdrop-blur-2xl border-b border-base-content/5 p-2 pt-8 shadow-sm'>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <h1 className='text-2xl font-extrabold text-base-content tracking-tight flex items-center gap-1.5'>
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Clock className='size-5 text-primary' />
                        </div>
                        Call History
                    </h1>
                    <div className="text-xs font-semibold text-base-content/40 bg-base-300/50 px-3 py-1.5 rounded-full border border-base-content/5">
                        {callLogs.length} Calls
                    </div>
                </div>
            </div>

            <div className='flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar'>
                {loading && (
                    <div className='flex flex-col justify-center items-center h-full gap-4'>
                        <span className='loading loading-spinner loading-lg text-primary'></span>
                        <p className="text-base-content/40 font-medium animate-pulse">Fetching your history...</p>
                    </div>
                )}

                {!loading && callLogs.length === 0 && (
                    <div className='flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60'>
                        <div className="p-8 bg-base-300/30 rounded-full">
                            <Phone className="size-16 text-base-content/20" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">No call logs found</p>
                            <p className="text-sm">Your recent voice and video calls will appear here.</p>
                        </div>
                    </div>
                )}

                {!loading && callLogs.length > 0 && (
                    <div className='max-w-4xl mx-auto space-y-2 pb-10'>
                        {callLogs.map((log) => {
                            if (!log.caller?._id || !log.callee?._id) return null;

                            const otherUser = log.receiverId || (authUser?._id === log.caller._id ? log.callee : log.caller);
                            const isOutgoing = authUser?._id === log.caller._id;
                            const wasMissedOrDeclined = log.status === "missed" || log.status === "declined";
                            const callDuration = formatDuration(log.duration);

                            return (
                                <div
                                    key={log._id}
                                    className='group flex items-center gap-4 p-4 rounded-3xl hover:bg-base-300/50 transition-all duration-300 border border-transparent hover:border-base-content/5 cursor-default'
                                >
                                    {/* Avatar Column */}
                                    <div className="relative">
                                        <img
                                            src={otherUser?.profilePic || "/avatar.png"}
                                            className="size-14 rounded-2xl object-cover border-2 border-base-300 shadow-md group-hover:scale-105 transition-transform"
                                            alt="Profile"
                                        />
                                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-base-100 shadow-lg ${wasMissedOrDeclined ? "bg-error" : "bg-success"}`}>
                                            {log.type === 'video' ? <Video size={10} className="text-white" /> : <Phone size={10} className="text-white" />}
                                        </div>
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="font-bold text-lg text-base-content truncate">
                                                {otherUser?.username || "Unknown User"}
                                                <span className="text-xs font-medium text-base-content/30 ml-2">#{otherUser?.tag}</span>
                                            </h3>
                                            <span className="text-[11px] font-bold text-base-content/30 uppercase tracking-widest">
                                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                {isOutgoing ? (
                                                    <ArrowUpRight size={14} className="text-primary" />
                                                ) : (
                                                    <ArrowDownLeft size={14} className={wasMissedOrDeclined ? "text-error" : "text-emerald-500"} />
                                                )}
                                            </div>
                                            <p className={`text-sm font-medium ${wasMissedOrDeclined ? "text-error/80" : "text-base-content/50"}`}>
                                                {wasMissedOrDeclined ? "Missed Call" : isOutgoing ? "Outgoing Call" : "Incoming Call"}
                                                {log.status === 'answered' && callDuration && (
                                                    <span className="ml-2 pl-2 border-l border-base-content/10">
                                                        {callDuration}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Column */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="btn btn-ghost btn-circle text-primary hover:bg-primary/10"
                                            onClick={() => {/* Redial logic could go here */ }}
                                        >
                                            <Phone size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallLogsPage;
