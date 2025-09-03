import { LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext"; // <-- CORRECT: Import useSocket
import useGetConversations from "../hooks/useGetConversations"; // Assuming you have this hook
import Conversation from "./Conversation"; // Assuming you have this component

const Sidebar = () => {
	const { authUser, logout } = useAuthStore();
	const { onlineUsers } = useSocket(); // <-- CORRECT: Get onlineUsers from the socket context
	const { conversations, loading } = useGetConversations();

	return (
		<div className='border-r border-slate-500 p-4 flex flex-col'>
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
							// This is the line that would crash if onlineUsers was undefined.
							// The optional chaining `?.` adds robustness, but the real fix is using the correct hook.
							isOnline={onlineUsers?.includes(conversation._id)}
						/>
					))}
			</div>
		</div>
	);
};

export default Sidebar;