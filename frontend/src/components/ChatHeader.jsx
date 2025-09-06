import { Phone, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "../context/SocketContext";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ChatHeader = () => {
    const { selectedUser, isTyping } = useChatStore();
    const { onlineUsers } = useSocket();
    const { initiateCall, setLocalStream } = useCallStore(); // Get setLocalStream
    const { socket } = useSocket();
    const navigate = useNavigate();

    if (!selectedUser) {
        return null;
    }

    const isOnline = onlineUsers.includes(selectedUser._id);

    const handleCall = async (callType) => {
        try {
            // Define ideal video constraints for better quality
            const videoConstraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
            };

            // 1. Get media stream BEFORE initiating the call
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === "video" ? videoConstraints : false,
                audio: true,
            });
            setLocalStream(stream); // 2. Save stream to the store

            // 3. Now initiate the call
            initiateCall(selectedUser, socket, callType);
            navigate("/call");
        } catch (error) {
            toast.error("Could not start call. Please allow camera and microphone access.");
            console.error("Error getting media stream:", error);
        }
    };

    return (
        <div className='flex items-center justify-between p-4 border-b bg-base-200'>
            <div className='flex items-center gap-3'>
                <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                    <div className='w-12 rounded-full'>
                        <img src={selectedUser.profilePic || "/avatar.png"} alt='user avatar' />
                    </div>
                </div>
                <div className='flex flex-col'>
                    <p className='font-bold text-gray-200'>{selectedUser.fullName}</p>
                    <span className='text-xs text-gray-400'>{isTyping ? "typing..." : isOnline ? "Online" : "Offline"}</span>
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