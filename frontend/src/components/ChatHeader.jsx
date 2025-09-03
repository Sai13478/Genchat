import { Phone, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "../context/SocketContext";
import useCallStore from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const ChatHeader = () => {
	const { selectedUser, isTyping } = useChatStore();
	const { onlineUsers } = useSocket(); // <-- CORRECT: Get onlineUsers from the socket context
	const { initiateCall } = useCallStore();
	const { socket } = useSocket();
	const { authUser } = useAuthStore();
	const navigate = useNavigate();

	// If no user is selected, don't render the header.
	if (!selectedUser) {
		return null;
	}

	// Safely check if the selected user is in the onlineUsers array.
	const isOnline = onlineUsers.includes(selectedUser._id);

	const handleCall = (callType) => {
		initiateCall(selectedUser, socket, authUser, callType);
		navigate("/call");
	};

	return (
		<div className='flex items-center justify-between p-4 border-b bg-base-200'>
			<div className='flex items-center gap-3'>
				<div className={`avatar ${isOnline ? "online" : "offline"}`}>
					<div className='w-12 rounded-full'>
						<img src={selectedUser.profilePic || "/avatar.png"} alt='user avatar' />
					</div>
				</div>
				<div className='flex flex-col'>
					<p className='font-bold text-gray-200'>{selectedUser.fullName}</p>
					<span className='text-xs text-gray-400'>{isTyping ? "typing..." : isOnline ? "Online" : "Offline"}</span>
				</div>
			</div>
			<div className='flex gap-4'>
				<Phone className='cursor-pointer hover:text-primary' onClick={() => handleCall("audio")} />
				<Video className='cursor-pointer hover:text-primary' onClick={() => handleCall("video")} />
			</div>
		</div>
	);
};

export default ChatHeader;