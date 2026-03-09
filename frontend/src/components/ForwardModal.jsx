import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search, Send } from "lucide-react";

const ForwardModal = ({ message, onClose }) => {
    const { users, forwardMessage } = useChatStore();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleForward = async (targetId, isGroup) => {
        const success = await forwardMessage(targetId, {
            text: message.text,
            image: message.image
        }, isGroup);

        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#222e35] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#202c33]">
                    <h2 className="text-lg font-bold text-white">Forward message</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full bg-[#2a3942] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-1 ring-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[350px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-slate-500 py-8 text-sm italic">No contacts found</p>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleForward(user._id, !!user.isGroup)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                                >
                                    <div className="relative">
                                        <img
                                            src={user.isGroup ? (user.image || "/group.png") : (user.profilePic || "/avatar.png")}
                                            alt="avatar"
                                            className="size-11 rounded-full border border-white/5"
                                        />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-slate-100 font-medium truncate">{user.isGroup ? user.name : user.username}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{user.isGroup ? `${user.members?.length} members` : (user.tag ? `#${user.tag}` : "Contact")}</p>
                                    </div>
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <Send size={14} className="text-primary" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
