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
        <div className='flex items-center justify-between p-4 border-b border-base-content/5 bg-base-100/10 backdrop-blur-md'>
            <div className='flex items-center gap-3'>
                {/* Back button - visible only on mobile */}
                <button
                    className='md:hidden btn btn-ghost btn-sm btn-circle'
                    onClick={() => setSelectedUser(null)}
                >
                    <ArrowLeft className='size-5' />
                </button>
                <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                    <div className='w-12 rounded-full'>
                        <img src={selectedUser.profilePic || "/avatar.png"} alt='user avatar' />
                    </div>
                </div>
                <div className='flex flex-col'>
                    <p className='font-bold text-base-content'>
                        {selectedUser.username}
                        <span className="text-[10px] opacity-40 ml-1">#{selectedUser.tag}</span>
                    </p>
                    <span className='text-[10px] text-base-content/50 font-medium tracking-wide uppercase'>{isTyping ? "typing..." : isOnline ? "Online" : "Offline"}</span>
                </div>
            </div>
            <div className='flex gap-4'>
                <Phone className='cursor-pointer hover:text-primary' onClick={() => handleCall("audio")} />
                <Video className='cursor-pointer hover:text-primary' onClick={() => handleCall("video")} />
            </div>
        </div>
    );
};

export default ChatHeader;