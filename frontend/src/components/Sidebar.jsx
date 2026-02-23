import { useState } from "react";
import { LogOut, Search } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";
import Conversation from "./Conversation";

const Sidebar = () => {
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocket();
    const { users, getUsers, isUsersLoading, searchUser, addFriend } = useChatStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    useState(() => {
        getUsers();
    }, [getUsers]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.includes("#")) {
            toast.error("Format must be username#tag");
            return;
        }
        setIsSearching(true);
        const result = await searchUser(searchQuery);
        setSearchResult(result);
        setIsSearching(false);
    };

    const handleAddFriend = async () => {
        if (searchResult) {
            await addFriend(searchResult._id);
            setSearchResult(null);
            setSearchQuery("");
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
            <form onSubmit={handleSearch} className='mb-4 relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400' />
                <input
                    type='text'
                    placeholder='Search username#1234'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='input input-sm input-bordered w-full pl-9 pr-12'
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary font-bold">
                    {isSearching ? "..." : "Find"}
                </button>
            </form>

            {/* Search Result */}
            {searchResult && (
                <div className="bg-base-200 p-3 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src={searchResult.profilePic || "/avatar.png"} alt="avatar" className="size-8 rounded-full border" />
                            <div className="text-sm">
                                <p className="font-bold">{searchResult.username}#<span className="opacity-50">{searchResult.tag}</span></p>
                            </div>
                        </div>
                        <button onClick={handleAddFriend} className="btn btn-xs btn-primary">Add</button>
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