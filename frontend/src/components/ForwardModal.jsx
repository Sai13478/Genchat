import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search, Send } from "lucide-react";

const ForwardModal = ({ message, onClose }) => {
    const { users, sendMessage } = useChatStore();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleForward = async (targetId, isGroup) => {
        try {
            // Logic to forward message: send a new message with same text/image to target
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/send/${targetId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    text: message.text,
                    image: message.image,
                    isGroup,
                    forwardedFrom: message.senderId // Tracking if needed
                })
            });

            if (res.ok) {
                onClose();
                alert("Message forwarded!");
            }
        } catch (error) {
            console.error("Forwarding failed", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-[#222e35] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#202c33]">
                    <h2 className="text-lg font-bold text-white">Forward message</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full bg-[#2a3942] border-none rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-1 ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
                        {filteredUsers.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => handleForward(user._id, !!user.isGroup)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-[#2a3942] rounded-lg transition-all text-left"
                            >
                                <img
                                    src={user.isGroup ? (user.image || "/group.png") : (user.profilePic || "/avatar.png")}
                                    alt="avatar"
                                    className="size-10 rounded-full border border-white/5"
                                />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-slate-100 font-medium truncate">{user.isGroup ? user.name : user.username}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.isGroup ? `${user.members?.length} members` : `#${user.tag}`}</p>
                                </div>
                                <Send size={16} className="text-blue-500" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
