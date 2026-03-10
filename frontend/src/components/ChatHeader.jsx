import { useState } from "react";
import { ArrowLeft, Phone, Video, Search, MoreVertical, Pin, Info, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "../context/SocketContext";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import GroupProfileModal from "./GroupProfileModal";

const ChatHeader = () => {
    const { selectedUser, typingUsers, setSelectedUser, messages } = useChatStore();
    const { onlineUsers } = useSocket();
    const { initiateCall, setLocalStream } = useCallStore();
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const navigate = useNavigate();

    if (!selectedUser) return null;

    const isOnline = onlineUsers.includes(selectedUser._id);
    const pinnedMessages = messages.filter(m => m.isPinned);

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

    const typingLabel = typingUsers.length === 0
        ? (selectedUser.isGroup ? `${selectedUser.members?.length || 0} members` : (isOnline ? "Online" : "Offline"))
        : typingUsers.length === 1
            ? `${typingUsers[0].username} is typing...`
            : `${typingUsers.length} users are typing...`;

    return (
        <div className='flex flex-col bg-[#202c33] border-b border-white/5'>
            <div className='flex items-center justify-between px-4 py-2'>
                <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-xl transition-all"
                    onClick={() => selectedUser.isGroup ? setIsGroupModalOpen(true) : navigate("/profile")}
                >
                    {/* Back button - visible only on mobile */}
                    <button
                        className='md:hidden btn btn-ghost btn-sm btn-circle text-slate-400'
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(null);
                        }}
                    >
                        <ArrowLeft className='size-5' />
                    </button>
                    <div className={`avatar ${!selectedUser.isGroup && isOnline ? "online" : "offline"}`}>
                        <div className='w-10 rounded-full border border-white/10 bg-[#202c33] flex items-center justify-center overflow-hidden'>
                            <img src={selectedUser.isGroup ? (selectedUser.image || "/group.png") : (selectedUser.profilePic || "/avatar.png")} alt='avatar' />
                        </div>
                    </div>
                    <div className='flex flex-col'>
                        <div className="flex items-center gap-2">
                            <p className='font-bold text-slate-100 text-sm'>
                                {selectedUser.isGroup ? selectedUser.name : selectedUser.username}
                                {!selectedUser.isGroup && (
                                    <span className="text-[10px] text-slate-500 ml-1 font-medium hidden sm:inline">#{selectedUser.tag}</span>
                                )}
                            </p>
                            {selectedUser.isGroup && <Info size={14} className="text-slate-500" />}
                        </div>
                        <span className={`text-[10px] font-medium tracking-wide ${typingUsers.length > 0 ? "text-emerald-400 animate-pulse" : "text-slate-400"}`}>
                            {typingLabel}
                        </span>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <div className="flex items-center gap-3 text-slate-400">
                        {!selectedUser.isGroup && (
                            <>
                                <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all" onClick={() => handleCall("video")}>
                                    <Video size={20} />
                                </button>
                                <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all" onClick={() => handleCall("audio")}>
                                    <Phone size={18} />
                                </button>
                                <div className="w-px h-5 bg-slate-700/50 mx-1"></div>
                            </>
                        )}
                        <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all">
                            <Search size={20} />
                        </button>

                        {/* Close Chat Button */}
                        <button
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-all text-slate-400 relative z-50 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(null);
                            }}
                            title="Close Chat"
                        >
                            <X size={20} />
                        </button>

                        <button className="p-2 hover:bg-slate-700/50 rounded-full transition-all text-slate-500 cursor-not-allowed">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Pinned Messages Bar */}
            {pinnedMessages.length > 0 && (
                <div className="bg-[#111b21] px-4 py-1 flex items-center gap-2 border-t border-white/5 overflow-hidden">
                    <Pin size={12} className="text-blue-400 shrink-0" />
                    <div className="flex-1 text-[11px] text-slate-300 truncate">
                        <span className="font-bold text-blue-400 mr-1">Pinned:</span>
                        {pinnedMessages[pinnedMessages.length - 1].text}
                    </div>
                    {pinnedMessages.length > 1 && (
                        <span className="text-[9px] text-slate-500 shrink-0">+{pinnedMessages.length - 1} more</span>
                    )}
                </div>
            )}
            {/* Group Profile Modal */}
            {isGroupModalOpen && selectedUser.isGroup && (
                <GroupProfileModal onClose={() => setIsGroupModalOpen(false)} />
            )}
        </div>
    );
};

export default ChatHeader;