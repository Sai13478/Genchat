import { useChatStore } from "../store/useChatStore";

const Conversation = ({ conversation, isOnline }) => {
	const { selectedUser, setSelectedUser } = useChatStore();
	const isSelected = selectedUser?._id === conversation._id;

	return (
		<>
			<div
				className={`flex gap-3 items-center hover:bg-primary/10 rounded-xl p-2 cursor-pointer transition-all duration-300
				${isSelected ? "bg-primary/20 shadow-sm" : ""}
			`}
				onClick={() => setSelectedUser(conversation)}
			>
				<div className={`avatar ${isOnline ? "online" : ""}`}>
					<div className='w-12 rounded-full'>
						<img src={conversation.profilePic || "/avatar.png"} alt='user avatar' />
					</div>
				</div>

				<div className='flex flex-col flex-1 min-w-0'>
					<p className={`font-bold transition-colors ${isSelected ? "text-primary" : "text-base-content"}`}>
						{conversation.username}
						<span className='text-[10px] opacity-40 ml-1'>#{conversation.tag}</span>
					</p>
				</div>
			</div>
			<div className='border-b border-white/5 mx-4' />
		</>
	);
};
export default Conversation;