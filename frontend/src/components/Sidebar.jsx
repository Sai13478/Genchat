import { useState } from "react";
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

    useState(() => {
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
        <div className='border-r border-base-300 p-4 flex flex-col w-full h-full'>
            <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                    <img src={authUser.profilePic || "/avatar.png"} alt='User avatar' className='size-8 rounded-full border' />
                    <p className="font-medium">{authUser.username}<span className="text-xs opacity-50">#{authUser.tag}</span></p>
                </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className='mb-4 space-y-2'>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className='absolute left-2 top-1/2 -translate-y-1/2 size-3 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Username'
                            value={usernameQuery}
                            onChange={(e) => setUsernameQuery(e.target.value)}
                            className='input input-xs input-bordered w-full pl-7'
                        />
                    </div>
                    <div className="flex items-center text-xs opacity-50">#</div>
                    <input
                        type='text'
                        placeholder='Tag'
                        maxLength={4}
                        value={tagQuery}
                        onChange={(e) => setTagQuery(e.target.value.replace(/\D/g, ""))}
                        className='input input-xs input-bordered w-16 text-center'
                    />
                    <button type="submit" className="btn btn-xs btn-primary">
                        {isSearching ? "..." : "Find"}
                    </button>
                </div>
            </form>

            {/* Search Result */}
            {searchResult && (
                <div className="bg-base-200 p-3 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2 border border-primary/20">
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
                            <div key={req._id} className="bg-base-200 p-2 rounded-lg flex items-center justify-between border border-primary/10">
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