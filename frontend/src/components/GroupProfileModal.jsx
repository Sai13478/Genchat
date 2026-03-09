import { useState, useRef, useEffect } from "react";
import { X, Camera, UserPlus, Shield, ShieldCheck, UserMinus, LogOut, Edit2, Check, Users, Settings, ShieldAlert } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

const GroupProfileModal = ({ onClose }) => {
    const { selectedUser, updateGroup, updateGroupSettings, manageAdmin, addMembers, removeMember, users } = useChatStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocket();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(selectedUser?.name || "");
    const [description, setDescription] = useState(selectedUser?.description || "");
    const [image, setImage] = useState(selectedUser?.image || "");
    const [isUploading, setIsUploading] = useState(false);

    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);

    const fileInputRef = useRef(null);

    const isAdmin = selectedUser?.admins?.some(admin =>
        (typeof admin === 'string' ? admin : admin._id) === authUser._id
    );

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const base64Image = reader.result;
            setIsUploading(true);
            await updateGroup(selectedUser._id, { image: base64Image });
            setImage(base64Image);
            setIsUploading(false);
        };
    };

    const handleUpdateProfile = async () => {
        if (!name.trim()) return toast.error("Group name is required");
        await updateGroup(selectedUser._id, { name, description });
        setIsEditing(false);
    };

    const handlePromote = async (memberId) => {
        await manageAdmin(selectedUser._id, memberId, "promote");
    };

    const handleDemote = async (memberId) => {
        await manageAdmin(selectedUser._id, memberId, "demote");
    };

    const handleRemove = async (memberId) => {
        if (confirm("Are you sure you want to remove this member?")) {
            await removeMember(selectedUser._id, memberId);
        }
    };

    const handleToggleSetting = async (settingName, value) => {
        const newSettings = { ...selectedUser.settings, [settingName]: value };
        await updateGroupSettings(selectedUser._id, newSettings);
    };

    const handleLeave = async () => {
        if (confirm("Are you sure you want to leave this group?")) {
            await removeMember(selectedUser._id, authUser._id);
            onClose();
        }
    };

    const handleAddMembersSubmit = async () => {
        if (selectedNewMembers.length === 0) return;
        await addMembers(selectedUser._id, selectedNewMembers);
        setShowAddMember(false);
        setSelectedNewMembers([]);
    };

    const toggleNewMember = (userId) => {
        if (selectedNewMembers.includes(userId)) {
            setSelectedNewMembers(selectedNewMembers.filter(id => id !== userId));
        } else {
            setSelectedNewMembers([...selectedNewMembers, userId]);
        }
    };

    const friendsNotMembers = users.filter(u =>
        !u.isGroup && !selectedUser.members.some(m => (typeof m === 'string' ? m : m._id) === u._id)
    );

    const isUserAdmin = (memberId) => {
        return selectedUser?.admins?.some(admin =>
            (typeof admin === 'string' ? admin : admin._id) === memberId
        );
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#222e35] w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-[#202c33] border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-primary" /> Group Info
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative group">
                            <div className="size-32 rounded-full border-4 border-[#202c33] shadow-2xl overflow-hidden bg-[#2a3942] flex items-center justify-center">
                                <img
                                    src={image || "/group.png"}
                                    alt="Group"
                                    className={`object-cover w-full h-full transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="loading loading-spinner loading-md text-primary"></span>
                                    </div>
                                )}
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Camera size={18} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        <div className="w-full space-y-2">
                            {isEditing ? (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-[#2a3942] border border-primary/30 rounded-xl px-4 py-2 text-center text-white outline-none focus:border-primary transition-all"
                                        placeholder="Group Name"
                                    />
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-[#2a3942] border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none focus:border-primary/50 transition-all min-h-[80px]"
                                        placeholder="Add a description..."
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
                                        <button onClick={handleUpdateProfile} className="flex-1 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-sm font-bold flex items-center justify-center gap-2">
                                            <Check size={16} /> Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-2">
                                        <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                                        {isAdmin && (
                                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-500 hover:text-primary transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 px-4">{selectedUser.description || "No description provided."}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Group Settings Section (Admins Only) */}
                    {isAdmin && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 px-1">
                                <Settings size={14} className="text-slate-500" />
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Group Settings</h4>
                            </div>

                            <div className="space-y-3">
                                {/* Edit Group Info Setting */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#202c33]/50 border border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-slate-200">Edit Group Info</span>
                                        <span className="text-[10px] text-slate-500">Who can change name, image, and description</span>
                                    </div>
                                    <select
                                        value={selectedUser.settings?.editGroupInfo ? "admins" : "everyone"}
                                        onChange={(e) => handleToggleSetting("editGroupInfo", e.target.value === "admins")}
                                        className="bg-[#2a3942] border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none focus:border-primary/50"
                                    >
                                        <option value="everyone">Everyone</option>
                                        <option value="admins">Only Admins</option>
                                    </select>
                                </div>

                                {/* Send Messages Setting */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#202c33]/50 border border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-slate-200">Send Messages</span>
                                        <span className="text-[10px] text-slate-500">Who can send messages to this group</span>
                                    </div>
                                    <select
                                        value={selectedUser.settings?.sendMessages ? "admins" : "everyone"}
                                        onChange={(e) => handleToggleSetting("sendMessages", e.target.value === "admins")}
                                        className="bg-[#2a3942] border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none focus:border-primary/50"
                                    >
                                        <option value="everyone">Everyone</option>
                                        <option value="admins">Only Admins</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Members ({selectedUser.members?.length})</h4>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowAddMember(!showAddMember)}
                                    className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                >
                                    <UserPlus size={14} /> Add Members
                                </button>
                            )}
                        </div>

                        {showAddMember && (
                            <div className="bg-[#202c33] rounded-2xl p-4 border border-primary/20 animate-in slide-in-from-top-2 duration-300 space-y-4">
                                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {friendsNotMembers.length === 0 ? (
                                        <p className="text-center text-xs text-slate-500 py-4">All your friends are already in this group.</p>
                                    ) : (
                                        friendsNotMembers.map(friend => (
                                            <div
                                                key={friend._id}
                                                onClick={() => toggleNewMember(friend._id)}
                                                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${selectedNewMembers.includes(friend._id) ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={friend.profilePic || "/avatar.png"} alt="" className="size-8 rounded-full" />
                                                    <span className="text-sm text-slate-200">{friend.username}</span>
                                                </div>
                                                <div className={`size-4 rounded-full border-2 flex items-center justify-center ${selectedNewMembers.includes(friend._id) ? 'bg-primary border-primary' : 'border-slate-700'}`}>
                                                    {selectedNewMembers.includes(friend._id) && <Check size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {selectedNewMembers.length > 0 && (
                                    <button
                                        onClick={handleAddMembersSubmit}
                                        className="w-full py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                    >
                                        ADD {selectedNewMembers.length} MEMBER{selectedNewMembers.length > 1 ? 'S' : ''}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="space-y-1">
                            {selectedUser.members?.map((member) => {
                                const mId = typeof member === 'object' ? member._id : member;
                                const mUsername = typeof member === 'object' ? member.username : "User";
                                const mPic = typeof member === 'object' ? member.profilePic : "/avatar.png";
                                const isMemberAdmin = isUserAdmin(mId);
                                const isMe = mId === authUser._id;
                                const isUserOnline = onlineUsers.includes(mId);

                                return (
                                    <div key={mId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#202c33] transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={mPic || "/avatar.png"} alt="" className="size-10 rounded-full border border-white/5" />
                                                {isUserOnline && (
                                                    <div className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-[#222e35]"></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-200">{mUsername} {isMe && "(You)"}</span>
                                                    {isMemberAdmin && (
                                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-tighter">Admin</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500">{isUserOnline ? 'Online' : 'Offline'}</p>
                                            </div>
                                        </div>

                                        {isAdmin && !isMe && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isMemberAdmin ? (
                                                    <button
                                                        onClick={() => handleDemote(mId)}
                                                        className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                                                        title="Dismiss as admin"
                                                    >
                                                        <Shield size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePromote(mId)}
                                                        className="p-2 text-slate-500 hover:text-primary transition-colors"
                                                        title="Make admin"
                                                    >
                                                        <ShieldCheck size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemove(mId)}
                                                    className="p-2 text-slate-500 hover:text-error transition-colors"
                                                    title="Remove from group"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#202c33] border-t border-white/5 flex gap-3">
                    <button
                        onClick={handleLeave}
                        className="flex-1 py-3 px-4 rounded-2xl border border-error/20 text-error hover:bg-error/5 transition-all text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Leave Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupProfileModal;
