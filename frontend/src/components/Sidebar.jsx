import { useEffect, useState, useRef } from "react";
import { LogOut, Search, MessageSquare, User, Settings, UserPlus, Users, Plus, X, Check, Archive, Lock, Unlock, ChevronDown, ChevronRight } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";
import { useNavigate, useLocation } from "react-router-dom";
import Conversation from "./Conversation";
import toast from "react-hot-toast";

const Sidebar = () => {
    const { authUser, logout } = useAuthStore();
    const { onlineUsers } = useSocket();
    const { users, getUsers, isUsersLoading, searchUser, sendFriendRequest, friendRequests, acceptFriendRequest, rejectFriendRequest, createGroup, archivedChats, loadArchivedChats, hideConversation, unhideConversation, toggleArchive, hiddenChats, loadHiddenChats, isVaultOpen, setVaultOpen } = useChatStore();
    const [usernameQuery, setUsernameQuery] = useState("");
    const [tagQuery, setTagQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDesc, setGroupDesc] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);

    // Privacy state
    const [showArchived, setShowArchived] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { x, y, conversation }
    const [hideKeyModal, setHideKeyModal] = useState(null); // conversation object
    const [hideKeyInput, setHideKeyInput] = useState("");
    const [unhideKeyModal, setUnhideKeyModal] = useState(null);
    const [vaultKeyModal, setVaultKeyModal] = useState(false);
    const [vaultKeyInput, setVaultKeyInput] = useState("");
    const contextMenuRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        getUsers();
        loadArchivedChats();
    }, [getUsers, loadArchivedChats]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    const handleContextMenu = (e, conversation) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, conversation });
    };

    const handleHideChat = () => {
        setHideKeyModal(contextMenu.conversation);
        setHideKeyInput("");
        setContextMenu(null);
    };

    const handleHideSubmit = async () => {
        if (!hideKeyInput || hideKeyInput.length < 4) return;
        await hideConversation(hideKeyModal.conversationId, hideKeyInput);
        setHideKeyModal(null);
        setHideKeyInput("");
    };

    const handleArchiveChat = async () => {
        await toggleArchive(contextMenu.conversation.conversationId || contextMenu.conversation._id);
        setContextMenu(null);
    };

    const handleUnhideChat = () => {
        setUnhideKeyModal(contextMenu.conversation);
        setHideKeyInput("");
        setContextMenu(null);
    };

    const handleUnhideSubmit = async () => {
        if (!hideKeyInput) return;
        await unhideConversation(unhideKeyModal.conversationId || unhideKeyModal._id, hideKeyInput);
        setUnhideKeyModal(null);
        setHideKeyInput("");
    };

    const handleVaultSubmit = async () => {
        if (vaultKeyInput.length < 4) return toast.error("Key must be 4+ chars");
        await loadHiddenChats();
        setVaultOpen(true);
        setVaultKeyModal(false);
        setVaultKeyInput("");
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!usernameQuery.trim() || !tagQuery.trim()) {
            toast.error("Both username and tag are required");
            return;
        }

        if (tagQuery.length !== 4 || isNaN(tagQuery)) {
            toast.error("Tag must be a 4-digit number");
            return;
        }

        setIsSearching(true);
        const result = await searchUser(`${usernameQuery}#${tagQuery}`);
        setSearchResult(result);
        setIsSearching(false);
    };

    const handleSendRequest = async () => {
        if (searchResult) {
            await sendFriendRequest(searchResult._id);
            setSearchResult(null);
            setUsernameQuery("");
            setTagQuery("");
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return toast.error("Group name is required");

        await createGroup({
            name: groupName,
            description: groupDesc,
            members: selectedMembers
        });

        setIsGroupModalOpen(false);
        setGroupName("");
        setGroupDesc("");
        setSelectedMembers([]);
    };

    const toggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const navItems = [
        { icon: MessageSquare, path: "/", label: "Messages" },
        { icon: User, path: "/profile", label: "Profile" },
        { icon: Settings, path: "/settings", label: "Settings" },
    ];

    const friendsOnly = users.filter(u => !u.isGroup);

    return (
        <>
            <div className='flex flex-col w-full h-full orbit-sidebar overflow-hidden relative'>
                {/* WhatsApp Style Navigation Header */}
                <div className='px-4 py-3 bg-[#202c33] flex items-center justify-between border-b border-white/5'>
                    <div
                        className="relative cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate("/profile")}
                    >
                        <img src={authUser.profilePic || "/avatar.png"} alt='User' className='size-10 rounded-full border border-slate-700 object-cover shadow-lg' />
                        <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            className="p-2 rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all"
                            title="Create Group"
                        >
                            <Users className="size-5" />
                        </button>
                        {!isVaultOpen ? (
                            <button
                                onClick={() => setVaultKeyModal(true)}
                                className="p-2 rounded-full text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                                title="Open Vault"
                            >
                                <Lock className="size-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setVaultOpen(false)}
                                className="p-2 rounded-full text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                title="Vault Open"
                            >
                                <Unlock className="size-5" />
                            </button>
                        )}
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`p-2 rounded-full transition-all group relative ${location.pathname === item.path ? "text-primary bg-primary/10" : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"}`}
                                title={item.label}
                            >
                                <item.icon className="size-5" />
                                {location.pathname === item.path && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                                )}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full text-slate-400 hover:bg-error/10 hover:text-error transition-all"
                            title="Logout"
                        >
                            <LogOut className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    {/* Search bar - Compact */}
                    <form onSubmit={handleSearch} className='mb-4'>
                        <div className="flex items-center gap-2 p-2 bg-[#202c33] rounded-lg border border-white/5 focus-within:border-blue-500/50 transition-all">
                            <div className="relative flex-1">
                                <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search or start new chat'
                                    value={usernameQuery}
                                    onChange={(e) => setUsernameQuery(e.target.value)}
                                    className='w-full bg-transparent text-sm pl-9 pr-2 py-1 outline-none text-slate-200 placeholder:text-slate-500'
                                />
                            </div>
                            <div className="h-4 w-px bg-slate-700/50"></div>
                            <input
                                type='text'
                                placeholder='####'
                                maxLength={4}
                                value={tagQuery}
                                onChange={(e) => setTagQuery(e.target.value.replace(/\D/g, ""))}
                                className='w-12 bg-transparent text-xs text-center outline-none text-slate-400 placeholder:text-slate-600 font-mono'
                            />
                            <button type="submit" className="bg-primary/20 text-primary p-1.5 rounded-full hover:bg-primary hover:text-white transition-all">
                                {isSearching ? <span className="loading loading-spinner size-3"></span> : <UserPlus className="size-4" />}
                            </button>
                        </div>
                    </form>

                    {/* Search Result */}
                    {searchResult && (
                        <div className="p-4 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2 border border-white/10 bg-[#202c33] shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={searchResult.profilePic || "/avatar.png"} alt="avatar" className="size-10 rounded-xl border border-slate-700 shadow-md" />
                                    <div className="text-sm">
                                        <p className="font-bold text-slate-100">{searchResult.username}#<span className="text-slate-500">{searchResult.tag}</span></p>
                                    </div>
                                </div>
                                <button onClick={handleSendRequest} className="btn btn-xs btn-primary shadow-lg shadow-primary/20">Send Request</button>
                            </div>
                        </div>
                    )}

                    {/* Friend Requests */}
                    {friendRequests.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 mb-3 px-1 uppercase tracking-wider">Friend Requests ({friendRequests.length})</p>
                            <div className="space-y-2 max-h-40 overflow-auto pr-1">
                                {friendRequests.map((req) => (
                                    <div key={req._id} className="p-3 rounded-xl flex items-center justify-between border border-slate-700 bg-slate-800/20">
                                        <div className="flex items-center gap-2">
                                            <img src={req.from.profilePic || "/avatar.png"} alt="avatar" className="size-7 rounded-lg border border-slate-700" />
                                            <p className="text-xs font-medium text-slate-300 truncate max-w-[80px]">{req.from.username}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => acceptFriendRequest(req.from._id)} className="btn btn-[10px] h-6 min-h-6 btn-success px-2">Accept</button>
                                            <button onClick={() => rejectFriendRequest(req.from._id)} className="btn btn-[10px] h-6 min-h-6 btn-ghost px-2 bg-slate-700 hover:bg-slate-600">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='divider px-3 my-0' />

                    <div className='flex-1 overflow-auto mt-2'>
                        {isUsersLoading && (
                            <div className="flex justify-center p-4">
                                <span className="loading loading-spinner loading-sm"></span>
                            </div>
                        )}
                        {!isUsersLoading && users.length === 0 && (
                            <p className='text-center text-gray-400 text-sm mt-4'>No friends yet. Add some!</p>
                        )}
                        {!isUsersLoading &&
                            users.map((conversation) => (
                                <div
                                    key={conversation._id}
                                    onContextMenu={(e) => handleContextMenu(e, conversation)}
                                >
                                    <Conversation
                                        conversation={conversation}
                                        isOnline={onlineUsers?.includes(conversation._id)}
                                    />
                                </div>
                            ))}

                        {/* Hidden Chats Section (Vault) */}
                        {isVaultOpen && (
                            <div className="mt-4 mb-2 animate-in slide-in-from-top-2 duration-300">
                                <p className="text-[10px] font-bold text-emerald-500/70 border-b border-emerald-500/10 mb-2 pb-1 px-3 uppercase tracking-widest flex items-center gap-2">
                                    <Unlock size={10} /> Hidden Vault
                                </p>
                                {hiddenChats.length === 0 ? (
                                    <p className="px-3 py-2 text-[10px] text-slate-600 italic">No hidden conversations found.</p>
                                ) : (
                                    hiddenChats.map((conv) => (
                                        <div
                                            key={conv._id}
                                            onContextMenu={(e) => handleContextMenu(e, { ...conv, isHidden: true })}
                                            className="hover:bg-emerald-500/5 transition-colors rounded-xl"
                                        >
                                            <Conversation
                                                conversation={{
                                                    _id: conv._id,
                                                    conversationId: conv._id,
                                                    username: conv.participants?.find(p => p._id !== authUser._id)?.username || conv.name || "Hidden Chat",
                                                    profilePic: conv.participants?.find(p => p._id !== authUser._id)?.profilePic || conv.image,
                                                    isGroup: conv.isGroup,
                                                }}
                                                isOnline={onlineUsers?.includes(conv.participants?.find(p => p._id !== authUser._id)?._id)}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Archived Chats Section */}
                        {archivedChats.length > 0 && (
                            <div className="mt-2">
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <Archive size={14} />
                                    <span className="flex-1 text-left font-semibold">Archived ({archivedChats.length})</span>
                                    {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                {showArchived && archivedChats.map((conv) => (
                                    <div
                                        key={conv._id}
                                        onContextMenu={(e) => handleContextMenu(e, { ...conv, isArchived: true })}
                                        className="opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <Conversation
                                            conversation={{
                                                _id: conv._id,
                                                conversationId: conv._id,
                                                username: conv.participants?.find(p => p._id !== authUser._id)?.username || conv.name || "Chat",
                                                profilePic: conv.participants?.find(p => p._id !== authUser._id)?.profilePic || conv.image,
                                                isGroup: conv.isGroup,
                                            }}
                                            isOnline={isGroupModalOpen}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Group Modal */}
            {isGroupModalOpen && (
                <div className="absolute inset-0 z-50 bg-[#0b141a] flex flex-col animate-in slide-in-from-left duration-300">
                    <div className="px-4 py-8 bg-[#202c33] flex items-center gap-6">
                        <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="size-6" />
                        </button>
                        <h2 className="text-xl font-medium text-slate-100">New Group</h2>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="size-32 rounded-full bg-[#202c33] flex items-center justify-center border-2 border-dashed border-slate-700 group cursor-pointer hover:border-primary transition-all">
                                    <Plus className="size-8 text-slate-500 group-hover:text-primary" />
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Group Subject"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full bg-transparent border-b border-primary py-2 outline-none text-slate-100 placeholder:text-slate-600"
                            />
                            <textarea
                                placeholder="Group Description (optional)"
                                value={groupDesc}
                                onChange={(e) => setGroupDesc(e.target.value)}
                                className="w-full bg-[#202c33] p-3 rounded-lg outline-none text-slate-100 text-sm placeholder:text-slate-600 min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Select Members</p>
                            <div className="space-y-2">
                                {friendsOnly.map(friend => (
                                    <div
                                        key={friend._id}
                                        onClick={() => toggleMember(friend._id)}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#202c33] cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={friend.profilePic || "/avatar.png"} alt="" className="size-10 rounded-full object-cover" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{friend.username}</p>
                                                <p className="text-[10px] text-slate-500">#{friend.tag}</p>
                                            </div>
                                        </div>
                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMembers.includes(friend._id) ? "bg-primary border-primary" : "border-slate-700"}`}>
                                            {selectedMembers.includes(friend._id) && <Check className="size-3 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {groupName && (
                        <div className="p-6 bg-[#0b141a]">
                            <button
                                onClick={handleCreateGroup}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <Check className="size-6" />
                                CREATE GROUP
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-[200] bg-[#233138] border border-white/10 rounded-xl shadow-2xl overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.conversation.isArchived ? (
                        <button onClick={handleArchiveChat} className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-white/5 text-emerald-400 hover:text-emerald-300 transition-colors">
                            <Archive size={15} /> Unarchive Chat
                        </button>
                    ) : contextMenu.conversation.isHidden ? (
                        <button onClick={handleUnhideChat} className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-white/5 text-emerald-400 hover:text-emerald-300 transition-colors">
                            <Unlock size={15} /> Unhide Chat
                        </button>
                    ) : (
                        <>
                            <button onClick={handleArchiveChat} className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-white/5 text-slate-300 hover:text-white transition-colors">
                                <Archive size={15} /> Archive Chat
                            </button>
                            <button onClick={handleHideChat} className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-white/5 text-slate-300 hover:text-white transition-colors">
                                <Lock size={15} /> Lock & Hide Chat
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Hide Key Modal */}
            {hideKeyModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 backdrop-blur-sm">
                    <div className="bg-[#222e35] w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Lock size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Lock Chat</h3>
                                <p className="text-xs text-slate-500">Set a secret key to hide this chat</p>
                            </div>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter a secret key (min 4 chars)"
                            value={hideKeyInput}
                            onChange={(e) => setHideKeyInput(e.target.value)}
                            className="w-full bg-[#2a3942] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-colors mb-4"
                            onKeyDown={(e) => e.key === "Enter" && handleHideSubmit()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setHideKeyModal(null)} className="flex-1 py-2.5 rounded-xl bg-[#2a3942] text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                            <button onClick={handleHideSubmit} disabled={hideKeyInput.length < 4} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-40 transition-colors text-sm">Lock Chat</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unhide Key Modal */}
            {unhideKeyModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 backdrop-blur-sm">
                    <div className="bg-[#222e35] w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Unlock size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Unlock Chat</h3>
                                <p className="text-xs text-slate-500">Enter secret key to unhide</p>
                            </div>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter secret key"
                            value={hideKeyInput}
                            onChange={(e) => setHideKeyInput(e.target.value)}
                            className="w-full bg-[#2a3942] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition-colors mb-4"
                            onKeyDown={(e) => e.key === "Enter" && handleUnhideSubmit()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setUnhideKeyModal(null)} className="flex-1 py-2.5 rounded-xl bg-[#2a3942] text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                            <button onClick={handleUnhideSubmit} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors text-sm">Unhide Chat</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vault Key Modal */}
            {vaultKeyModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 backdrop-blur-sm">
                    <div className="bg-[#222e35] w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Lock size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Hidden Vault</h3>
                                <p className="text-xs text-slate-500">Enter your master key to reveal hidden chats</p>
                            </div>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter master key"
                            value={vaultKeyInput}
                            onChange={(e) => setVaultKeyInput(e.target.value)}
                            className="w-full bg-[#2a3942] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-colors mb-4"
                            onKeyDown={(e) => e.key === "Enter" && handleVaultSubmit()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setVaultKeyModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#2a3942] text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                            <button onClick={handleVaultSubmit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors text-sm">Enter Vault</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;