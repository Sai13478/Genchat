import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Paperclip, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";

const MessageInput = () => {
	const [text, setText] = useState("");
	const [imagePreview, setImagePreview] = useState(null);
	const fileInputRef = useRef(null);
	const { sendMessage, selectedUser, replyingTo, setReplyingTo, editMessage, editingMessage, setEditingMessage } = useChatStore();
	const { socket } = useSocket();
	const typingTimeoutRef = useRef(null);

	// Sync text with editing message
	useEffect(() => {
		if (editingMessage) {
			setText(editingMessage.text);
		}
	}, [editingMessage]);

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const removeImage = () => {
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSendMessage = async (e) => {
		e.preventDefault();
		if (!text.trim() && !imagePreview) return;

		try {
			if (editingMessage) {
				await editMessage(editingMessage._id, text.trim());
				setEditingMessage(null);
			} else {
				socket?.emit("stop-typing", { to: selectedUser._id });

				await sendMessage({
					text: text.trim(),
					image: imagePreview,
				}, selectedUser.isGroup);
			}

			// Clear form
			setText("");
			setImagePreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleCancelAction = () => {
		setReplyingTo(null);
		setEditingMessage(null);
		setText("");
	};

	const handleTyping = (e) => {
		setText(e.target.value);
		const { authUser } = useAuthStore.getState();
		socket?.emit("typing", { to: selectedUser._id, username: authUser.username });

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		typingTimeoutRef.current = setTimeout(() => {
			socket?.emit("stop-typing", { to: selectedUser._id, username: authUser.username });
		}, 2000); // 2 seconds of inactivity
	};

	return (
		<div className='w-full bg-[#202c33] border-t border-white/5'>
			{/* Action Previews (Reply / Edit) */}
			{(replyingTo || editingMessage || imagePreview) && (
				<div className="p-3 bg-[#111b21] animate-in slide-in-from-bottom-2 duration-200">
					{replyingTo && (
						<div className="flex items-center justify-between bg-[#202c33] p-2 rounded-lg border-l-4 border-primary">
							<div className="flex flex-col text-xs overflow-hidden">
								<span className="text-primary font-bold">Replying to</span>
								<span className="text-slate-400 truncate italic">"{replyingTo.text}"</span>
							</div>
							<button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full">
								<X size={14} />
							</button>
						</div>
					)}
					{editingMessage && (
						<div className="flex items-center justify-between bg-[#202c33] p-2 rounded-lg border-l-4 border-emerald-500">
							<div className="flex flex-col text-xs overflow-hidden">
								<span className="text-emerald-500 font-bold">Editing message</span>
								<span className="text-slate-400 truncate italic">"{editingMessage.text}"</span>
							</div>
							<button onClick={() => setEditingMessage(null)} className="p-1 hover:bg-white/10 rounded-full">
								<X size={14} />
							</button>
						</div>
					)}
					{imagePreview && (
						<div className='flex items-center gap-2 px-2 mt-2'>
							<div className='relative'>
								<img src={imagePreview} alt='Preview' className='w-16 h-16 object-cover rounded-lg border border-white/10 shadow-lg' />
								<button onClick={removeImage} className='absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#202c33] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors' type='button'>
									<X className='size-3.5' />
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			<form onSubmit={handleSendMessage} className='p-3 flex items-center gap-2'>
				<div className="flex items-center gap-1">
					<button
						type='button'
						className="p-2 text-slate-400 hover:text-white transition-all rounded-lg"
					>
						<Smile size={22} />
					</button>
					<button
						type='button'
						className={`p-2 transition-all rounded-lg ${imagePreview ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
						onClick={() => fileInputRef.current?.click()}
					>
						<Paperclip size={22} className={imagePreview ? "rotate-45" : ""} />
					</button>
					<input type='file' accept='image/*' className='hidden' ref={fileInputRef} onChange={handleImageChange} />
				</div>

				<div className='flex-1 relative'>
					<input
						type='text'
						className='w-full bg-[#2a3942] border-none rounded-lg px-5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-500 text-[#e9edef]'
						placeholder={editingMessage ? "Edit message..." : 'Type a message'}
						value={text}
						onChange={handleTyping}
					/>
				</div>

				<button
					type='submit'
					className='p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 active:scale-95 transition-all disabled:bg-[#202c33] disabled:text-slate-600'
					disabled={!text.trim() && !imagePreview}
				>
					<Send size={20} />
				</button>
			</form>
		</div>
	);
};
export default MessageInput;