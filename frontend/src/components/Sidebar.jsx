import { useState } from "react";
import { LogOut, Search } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import useGetConversations from "../hooks/useGetConversations";
import Conversation from "./Conversation";

const Sidebar = () => {
    const { authUser, logout } = useAuthStore();
    const { onlineUsers } = useSocket();
    const { conversations, loading } = useGetConversations();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter((c) =>
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='border-r border-slate-500 p-4 flex flex-col w-full h-full'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <img src={authUser.profilePic} alt='User avatar' className='w-8 h-8 rounded-full' />
                    <p>{authUser.fullName}</p>
                </div>
                <LogOut className='cursor-pointer' onClick={logout} />
            </div>

            {/* Search bar */}
            <div className='mt-3 relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400' />
                <input
                    type='text'
                    placeholder='Search conversations...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='input input-sm input-bordered w-full pl-9'
                />
            </div>

            <div className='divider px-3' />

            <div className='flex-1 overflow-auto'>
                {loading && <p>Loading conversations...</p>}
                {!loading && filteredConversations.length === 0 && searchQuery && (
                    <p className='text-center text-gray-400 text-sm mt-4'>No conversations found</p>
                )}
                {!loading &&
                    filteredConversations.map((conversation) => (
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