import { useChatStore } from "../store/useChatStore";

const Conversation = ({ conversation, isOnline }) => {
	const { selectedUser, setSelectedUser } = useChatStore();
	const isSelected = selectedUser?._id === conversation._id;

	return (
		<>
			<div
				className={`flex gap-3 items-center hover:bg-slate-800/60 rounded-xl p-3 cursor-pointer transition-all duration-300 group
				${isSelected ? "bg-slate-800 shadow-lg border border-slate-700" : "border border-transparent"}
			`}
				onClick={() => setSelectedUser(conversation)}
			>
				<div className={`avatar ${isOnline ? "online" : ""}`}>
					<div className='w-12 rounded-xl'>
						<img src={conversation.profilePic || "/avatar.png"} alt='user avatar' />
					</div>
				</div>

				<div className='flex flex-col flex-1 min-w-0'>
					<p className={`font-bold transition-all duration-300 ${isSelected ? "text-primary tracking-tight" : "text-slate-300 group-hover:text-white"}`}>
						{conversation.username}
						<span className='text-[10px] text-slate-500 ml-1 font-medium'>#{conversation.tag}</span>
					</p>
				</div>
			</div>
			<div className='border-b border-white/5 mx-4' />
		</>
	);
};
export default Conversation;