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
        <div className='flex flex-col h-screen bg-base-200 w-full transition-colors duration-500'>
            <div className='bg-base-100/40 backdrop-blur-xl border-b border-base-content/10 p-4 pt-20'>
                <h1 className='text-2xl font-bold text-base-content flex items-center'>
                    <Clock className='mr-2 size-6 text-primary' /> Call History
                </h1>
            </div>

            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {loading && (
                    <div className='flex justify-center items-center h-full'>
                        <span className='loading loading-spinner loading-lg text-primary'></span>
                    </div>
                )}

                {!loading && callLogs.length === 0 && (
                    <div className='text-center text-base-content/50 mt-10'>
                        <p className="text-lg">No call logs found.</p>
                        <p className="text-sm">Your call history will appear here.</p>
                    </div>
                )}

                {!loading && callLogs.length > 0 && (
                    <ul className='space-y-3 max-w-4xl mx-auto'>
                        {callLogs.map((log) => {
                            if (!log.caller?._id || !log.callee?._id) return null;

                            const otherUser = log.receiverId || (authUser?._id === log.caller._id ? log.callee : log.caller);
                            const isOutgoing = authUser?._id === log.caller._id;
                            const wasMissedOrDeclined = log.status === "missed" || log.status === "declined";
                            const callDuration = formatDuration(log.duration);

                            return (
                                <li key={log._id} className='glassy p-4 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.01]'>
                                    <div className='flex items-center gap-4'>
                                        <div className={`p-3 rounded-full ${wasMissedOrDeclined ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <p className='font-bold text-base-content'>
                                                {otherUser?.username || "Unknown User"}
                                                {otherUser?.tag && <span className="text-xs opacity-40 ml-1">#{otherUser.tag}</span>}
                                            </p>
                                            <div className='flex items-center text-xs text-base-content/60 mt-0.5'>
                                                {isOutgoing ? <ArrowUpRight size={14} className="mr-1 text-primary" /> : <ArrowDownLeft size={14} className="mr-1 text-secondary" />}
                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${wasMissedOrDeclined ? "bg-error/10 text-error" : "bg-base-content/5 text-base-content/70"}`}>
                                        {log.status === 'answered' ? callDuration : log.status}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CallLogsPage;
