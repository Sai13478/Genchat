import { useEffect, useState } from "react";
import { LogOut, Search } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";
import Conversation from "./Conversation";
import toast from "react-hot-toast";

const Sidebar = () => {
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocket();
    const { users, getUsers, isUsersLoading, searchUser, sendFriendRequest, friendRequests, acceptFriendRequest, rejectFriendRequest } = useChatStore();
    const [usernameQuery, setUsernameQuery] = useState("");
    const [tagQuery, setTagQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

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

    return (
        <div className='flex flex-col w-full h-full p-6 overflow-hidden'>
            <div className='flex items-center justify-between mb-8 p-1'>
                <div className='flex items-center gap-3'>
                    <div className="relative group">
                        <img src={authUser.profilePic || "/avatar.png"} alt='User avatar' className='size-12 rounded-xl border-2 border-slate-700 object-cover shadow-2xl transition-all group-hover:border-primary/50 group-hover:scale-105' />
                        <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg"></div>
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-slate-100 text-lg leading-tight tracking-tight">{authUser.username}</p>
                        <p className="text-xs text-slate-500 font-medium">#{authUser.tag}</p>
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className='mb-6'>
                <div className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-xl border border-slate-700/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-inner">
                    <div className="relative flex-1">
                        <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500' />
                        <input
                            type='text'
                            placeholder='Search user...'
                            value={usernameQuery}
                            onChange={(e) => setUsernameQuery(e.target.value)}
                            className='w-full bg-transparent text-sm pl-9 pr-2 py-1 outline-none text-slate-200 placeholder:text-slate-600'
                        />
                    </div>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <input
                        type='text'
                        placeholder='Tag'
                        maxLength={4}
                        value={tagQuery}
                        onChange={(e) => setTagQuery(e.target.value.replace(/\D/g, ""))}
                        className='w-12 bg-transparent text-xs text-center outline-none text-slate-400 placeholder:text-slate-600'
                    />
                    <button type="submit" className="flex items-center justify-center size-8 rounded-lg bg-primary text-white hover:bg-primary-focus transition-all shadow-lg hover:scale-105 active:scale-95">
                        {isSearching ? <span className="loading loading-spinner size-3"></span> : <Search className="size-4" />}
                    </button>
                </div>
            </form>

            {/* Search Result */}
            {searchResult && (
                <div className="p-4 rounded-2xl mb-4 animate-in fade-in slide-in-from-top-2 border border-slate-700 bg-slate-800/40 shadow-xl">
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
                        <Conversation
                            key={conversation._id}
                            conversation={conversation}
                            isOnline={onlineUsers?.includes(conversation._id)}
                        />
                    ))}
            </div>
        </div>
    );
};

export default Sidebar;