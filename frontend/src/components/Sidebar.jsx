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
            <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center gap-3'>
                    <div className="relative group">
                        <img src={authUser.profilePic || "/avatar.png"} alt='User avatar' className='size-12 rounded-full border-2 border-primary/20 object-cover shadow-lg transition-all group-hover:border-primary/40' />
                        <div className="absolute bottom-0 right-0 size-3 bg-success rounded-full border-2 border-base-100"></div>
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-base-content text-lg leading-tight">{authUser.username}</p>
                        <p className="text-xs text-base-content/40 font-medium">#{authUser.tag}</p>
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className='mb-6'>
                <div className="flex items-center gap-2 p-1.5 glassy rounded-xl border border-white/5 focus-within:border-primary/30 transition-all">
                    <div className="relative flex-1">
                        <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-base-content/30' />
                        <input
                            type='text'
                            placeholder='Search user'
                            value={usernameQuery}
                            onChange={(e) => setUsernameQuery(e.target.value)}
                            className='w-full bg-transparent text-sm pl-8 pr-2 py-1 outline-none text-base-content placeholder:text-base-content/20'
                        />
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <input
                        type='text'
                        placeholder='Tag'
                        maxLength={4}
                        value={tagQuery}
                        onChange={(e) => setTagQuery(e.target.value.replace(/\D/g, ""))}
                        className='w-12 bg-transparent text-xs text-center outline-none text-base-content/60 placeholder:text-base-content/20'
                    />
                    <button type="submit" className="flex items-center justify-center size-7 rounded-lg bg-primary text-primary-content hover:bg-primary/90 transition-all shadow-md">
                        {isSearching ? <span className="loading loading-spinner size-3"></span> : <Search className="size-3.5" />}
                    </button>
                </div>
            </form>

            {/* Search Result */}
            {searchResult && (
                <div className="glassy p-3 rounded-2xl mb-4 animate-in fade-in slide-in-from-top-2 border border-white/10 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src={searchResult.profilePic || "/avatar.png"} alt="avatar" className="size-8 rounded-full border" />
                            <div className="text-sm">
                                <p className="font-bold">{searchResult.username}#<span className="opacity-50">{searchResult.tag}</span></p>
                            </div>
                        </div>
                        <button onClick={handleSendRequest} className="btn btn-xs btn-primary">Send Request</button>
                    </div>
                </div>
            )}

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold opacity-50 mb-2 px-1 uppercase tracking-wider">Friend Requests ({friendRequests.length})</p>
                    <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {friendRequests.map((req) => (
                            <div key={req._id} className="glassy p-2 rounded-xl flex items-center justify-between border border-white/10">
                                <div className="flex items-center gap-2">
                                    <img src={req.from.profilePic || "/avatar.png"} alt="avatar" className="size-6 rounded-full border" />
                                    <p className="text-xs font-medium truncate max-w-[80px]">{req.from.username}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => acceptFriendRequest(req.from._id)} className="btn btn-[10px] h-6 min-h-6 btn-success px-2">Accept</button>
                                    <button onClick={() => rejectFriendRequest(req.from._id)} className="btn btn-[10px] h-6 min-h-6 btn-ghost px-2 bg-base-300">Reject</button>
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