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
        <div className='flex flex-col h-screen bg-gray-100 dark:bg-gray-900 w-full'>
            <div className='bg-white dark:bg-gray-800 shadow-md p-4'>
                <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center'>
                    <Clock className='mr-2' /> Call History
                </h1>
            </div>

            <div className='flex-1 overflow-y-auto p-4'>
                {loading && (
                    <div className='flex justify-center items-center h-full'>
                        <span className='loading loading-spinner loading-lg'></span>
                    </div>
                )}

                {!loading && callLogs.length === 0 && (
                    <div className='text-center text-gray-500 dark:text-gray-400 mt-10'>
                        <p>No call logs found.</p>
                        <p>Your call history will appear here.</p>
                    </div>
                )}

                {!loading && callLogs.length > 0 && (
                    <ul className='space-y-4'>
                        {callLogs.map((log) => {
                            // Defensive check to prevent crashes if data is not populated
                            if (!log.caller?._id || !log.callee?._id) {
                                return null;
                            }

                            const otherUser = log.receiverId || (authUser?._id === log.caller._id ? log.callee : log.caller);
                            const isOutgoing = authUser?._id === log.caller._id;
                            
                            // *** FIX: Use log.status to determine if a call was missed or declined ***
                            const wasMissedOrDeclined = log.status === "missed" || log.status === "declined";
                            const callDuration = formatDuration(log.duration);

                            return (
                                <li key={log._id} className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between'>
                                    <div className='flex items-center'>
                                        <div className={`p-3 rounded-full mr-4 ${wasMissedOrDeclined ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <p className='font-semibold text-gray-800 dark:text-gray-200'>{otherUser?.fullName || "Unknown User"}</p>
                                            <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                {isOutgoing ? <ArrowUpRight size={16} className="mr-1"/> : <ArrowDownLeft size={16} className="mr-1"/>}
                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* *** FIX: Display the correct status or duration *** */}
                                    <div className={`text-sm capitalize font-medium ${wasMissedOrDeclined ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
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
