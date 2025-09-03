import { useChatStore } from "../store/useChatStore";

const Conversation = ({ conversation, isOnline }) => {
	const { selectedUser, setSelectedUser } = useChatStore();
	const isSelected = selectedUser?._id === conversation._id;

	return (
		<>
			<div
				className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer
				${isSelected ? "bg-sky-500" : ""}
			`}
				onClick={() => setSelectedUser(conversation)}
			>
				<div className={`avatar ${isOnline ? "online" : ""}`}>
					<div className='w-12 rounded-full'>
						<img src={conversation.profilePic || "/avatar.png"} alt='user avatar' />
					</div>
				</div>

				<div className='flex flex-col flex-1'>
					<p className='font-bold text-gray-200'>{conversation.fullName}</p>
				</div>
			</div>
			<div className='divider my-0 py-0 h-1' />
		</>
	);
};
export default Conversation;