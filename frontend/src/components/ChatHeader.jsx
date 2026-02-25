import { ArrowLeft, Phone, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "../context/SocketContext";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ChatHeader = () => {
    const { selectedUser, isTyping, setSelectedUser } = useChatStore();
    const { onlineUsers } = useSocket();
    const { initiateCall, setLocalStream } = useCallStore();
    const { socket } = useSocket();
    const navigate = useNavigate();

    if (!selectedUser) {
        return null;
    }

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
            console.error("Error getting media stream:", error);
        }
    };

    return (
        <div className='flex items-center justify-between p-4 border-b border-white/5 bg-transparent rounded-t-3xl'>
            <div className='flex items-center gap-3'>
                {/* Back button - visible only on mobile */}
                <button
                    className='md:hidden btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    onClick={() => setSelectedUser(null)}
                >
                    <ArrowLeft className='size-5' />
                </button>
                <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                    <div className='w-12 rounded-full border border-white/10'>
                        <img src={selectedUser.profilePic || "/avatar.png"} alt='user avatar' />
                    </div>
                </div>
                <div className='flex flex-col'>
                    <p className='font-bold text-slate-100'>
                        {selectedUser.username}
                        <span className="text-[10px] text-slate-500 ml-1 font-medium">#{selectedUser.tag}</span>
                    </p>
                    <span className='text-[10px] text-slate-400/80 font-medium tracking-wide uppercase'>
                        {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>
            <div className='flex gap-4'>
                <div className="flex items-center gap-2 bg-slate-800/40 p-2.5 rounded-2xl border border-slate-700/50 shadow-inner">
                    <Phone className='size-5 text-slate-400 cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95' onClick={() => handleCall("audio")} />
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <Video className='size-5 text-slate-400 cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95' onClick={() => handleCall("video")} />
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;