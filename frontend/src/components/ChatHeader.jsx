import { ArrowLeft, Phone, Video, Search, MoreVertical } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "../context/SocketContext";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ChatHeader = () => {
    const { selectedUser, isTyping, setSelectedUser } = useChatStore();
    const { onlineUsers } = useSocket();
    const { initiateCall, setLocalStream } = useCallStore();
    const navigate = useNavigate();

    if (!selectedUser) return null;

    const isOnline = onlineUsers.includes(selectedUser._id);

    const handleCall = async (callType) => {
        try {
            const videoConstraints = callType === "video" ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            } : false;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true,
            });
            setLocalStream(stream);

            initiateCall(selectedUser, callType, stream);
            navigate("/call");
        } catch (error) {
            toast.error("Could not start call. Please allow camera and microphone access.");
        }
    };

    return (
        <div className='flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-800/20 backdrop-blur-md'>
            <div className='flex items-center gap-3'>
                {/* Back button - visible only on mobile */}
                <button
                    className='md:hidden btn btn-ghost btn-sm btn-circle text-slate-400'
                    onClick={() => setSelectedUser(null)}
                >
                    <ArrowLeft className='size-5' />
                </button>
                <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                    <div className='w-10 rounded-full border border-white/10'>
                        <img src={selectedUser.profilePic || "/avatar.png"} alt='user avatar' />
                    </div>
                </div>
                <div className='flex flex-col'>
                    <p className='font-bold text-slate-100 text-sm'>
                        {selectedUser.username}
                        <span className="text-[10px] text-slate-500 ml-1 font-medium hidden sm:inline">#{selectedUser.tag}</span>
                    </p>
                    <span className='text-[10px] text-emerald-400 font-medium tracking-wide'>
                        {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>

            <div className='flex items-center gap-2'>
                <div className="flex items-center gap-3 text-slate-400">
                    <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all" onClick={() => handleCall("video")}>
                        <Video size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all" onClick={() => handleCall("audio")}>
                        <Phone size={18} />
                    </button>
                    <div className="w-px h-5 bg-slate-700/50 mx-1"></div>
                    <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all">
                        <Search size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;