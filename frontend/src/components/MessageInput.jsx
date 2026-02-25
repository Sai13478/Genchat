import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Paperclip, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

const MessageInput = () => {
	const [text, setText] = useState("");
	const [imagePreview, setImagePreview] = useState(null);
	const fileInputRef = useRef(null);
	const { sendMessage, selectedUser } = useChatStore();
	const { socket } = useSocket();
	const typingTimeoutRef = useRef(null);

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
			// Stop typing event when message is sent
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
			socket?.emit("stop-typing", { to: selectedUser._id });

			await sendMessage({
				text: text.trim(),
				image: imagePreview,
			});

			// Clear form
			setText("");
			setImagePreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleTyping = (e) => {
		setText(e.target.value);
		socket?.emit("typing", { to: selectedUser._id });

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		typingTimeoutRef.current = setTimeout(() => {
			socket?.emit("stop-typing", { to: selectedUser._id });
		}, 2000); // 2 seconds of inactivity
	};

	return (
		<div className='p-3 w-full bg-slate-900/40 border-t border-slate-800/50'>
			{imagePreview && (
				<div className='mb-3 flex items-center gap-2 px-2'>
					<div className='relative'>
						<img src={imagePreview} alt='Preview' className='w-16 h-16 object-cover rounded-xl border border-primary/20 shadow-lg' />
						<button onClick={removeImage} className='absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors' type='button'>
							<X className='size-3.5' />
						</button>
					</div>
				</div>
			)}

			<form onSubmit={handleSendMessage} className='flex items-center gap-2'>
				<div className="flex items-center gap-1">
					<button
						type='button'
						className="p-2 text-slate-400 hover:text-primary transition-all rounded-full hover:bg-slate-700/30"
					>
						<Smile size={22} />
					</button>
					<button
						type='button'
						className={`p-2 transition-all rounded-full hover:bg-slate-700/30 ${imagePreview ? "text-emerald-400" : "text-slate-400 hover:text-primary"}`}
						onClick={() => fileInputRef.current?.click()}
					>
						<Paperclip size={22} className={imagePreview ? "rotate-45" : ""} />
					</button>
					<input type='file' accept='image/*' className='hidden' ref={fileInputRef} onChange={handleImageChange} />
				</div>

				<div className='flex-1 relative'>
					<input
						type='text'
						className='w-full bg-slate-800/50 border border-slate-700/30 focus:border-primary/50 rounded-full px-5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-500 text-slate-100 shadow-inner'
						placeholder='Type a message'
						value={text}
						onChange={handleTyping}
					/>
				</div>

				<button
					type='submit'
					className='p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none'
					disabled={!text.trim() && !imagePreview}
				>
					<Send size={20} />
				</button>
			</form>
		</div>
	);
};
export default MessageInput;