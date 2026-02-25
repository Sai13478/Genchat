import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
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
		<div className='p-4 w-full'>
			{imagePreview && (
				<div className='mb-3 flex items-center gap-2'>
					<div className='relative'>
						<img src={imagePreview} alt='Preview' className='w-20 h-20 object-cover rounded-lg border border-zinc-700' />
						<button onClick={removeImage} className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center' type='button'>
							<X className='size-3' />
						</button>
					</div>
				</div>
			)}

			<form onSubmit={handleSendMessage} className='flex items-center gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-xl'>
				<div className='flex-1 flex gap-2'>
					<input
						type='text'
						className='w-full bg-slate-800/40 border border-slate-700/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-600 text-slate-100'
						placeholder='Type a message...'
						value={text}
						onChange={handleTyping}
					/>
					<input type='file' accept='image/*' className='hidden' ref={fileInputRef} onChange={handleImageChange} />

					<button
						type='button'
						className={`hidden sm:flex btn btn-ghost btn-circle shadow-none hover:bg-slate-700/50 ${imagePreview ? "text-emerald-400" : "text-slate-400"}`}
						onClick={() => fileInputRef.current?.click()}
					>
						<Image size={20} />
					</button>
				</div>
				<button
					type='submit'
					className='btn btn-primary btn-sm btn-circle shadow-lg shadow-primary/20 transition-transform active:scale-90 disabled:bg-slate-800 disabled:text-slate-600'
					disabled={!text.trim() && !imagePreview}
				>
					<Send size={18} />
				</button>
			</form>
		</div>
	);
};
export default MessageInput;