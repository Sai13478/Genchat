import { LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import useGetConversations from "../hooks/useGetConversations";
import Conversation from "./Conversation";

const Sidebar = () => {
    const { authUser, logout } = useAuthStore();
    const { onlineUsers } = useSocket();
    const { conversations, loading } = useGetConversations();

    return (
        <div className='border-r border-slate-500 p-4 flex-col hidden md:flex w-full md:w-1/3 max-w-sm'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <img src={authUser.profilePic} alt='User avatar' className='w-8 h-8 rounded-full' />
                    <p>{authUser.fullName}</p>
                </div>
                <LogOut className='cursor-pointer' onClick={logout} />
            </div>

            <div className='divider px-3' />

            <div className='flex-1 overflow-auto'>
                {loading && <p>Loading conversations...</p>}
                {!loading &&
                    conversations.map((conversation) => (
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