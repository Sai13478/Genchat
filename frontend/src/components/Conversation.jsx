import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";

const Conversation = ({ conversation, isOnline }) => {
	const { selectedUser, setSelectedUser } = useChatStore();
	const navigate = useNavigate();
	const isSelected = selectedUser?._id === conversation._id;

	const handleClick = () => {
		setSelectedUser(conversation);
		navigate("/");
	};

	return (
		<>
			<div
				onClick={handleClick}
				className={`flex gap-3 items-center hover:bg-[#202c33] p-3 cursor-pointer transition-colors duration-200
				${isSelected ? "bg-[#202c33]" : ""}
			`}
			>
				<div className={`avatar ${!conversation.isGroup && isOnline ? "online" : ""}`}>
					<div className='w-12 rounded-full border border-white/5 bg-[#202c33] flex items-center justify-center overflow-hidden'>
						<img src={conversation.isGroup ? (conversation.image || "/group.png") : (conversation.profilePic || "/avatar.png")} alt='avatar' className="object-cover w-full h-full" />
					</div>
				</div>

				<div className='flex flex-col flex-1 min-w-0'>
					<div className="flex justify-between items-baseline">
						<p className={`font-medium truncate ${isSelected ? "text-white" : "text-[#e9edef]"}`}>
							{conversation.isGroup ? conversation.name : conversation.username}
						</p>
						{!conversation.isGroup && (
							<span className='text-[10px] text-slate-500 font-medium'>#{conversation.tag}</span>
						)}
						{conversation.isGroup && (
							<span className='text-[10px] text-blue-400 font-medium'>Group</span>
						)}
					</div>
					{conversation.isGroup && conversation.description && (
						<p className="text-xs text-slate-500 truncate">{conversation.description}</p>
					)}
				</div>
			</div>
			<div className='border-b border-white/5 mx-4' />
		</>
	);
};
export default Conversation;