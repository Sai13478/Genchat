import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";

const useListenMessages = () => {
	const { socket } = useSocket();
	const { messages, setMessages } = useChatStore();

	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (newMessage) => {
			setMessages([...messages, newMessage]);
		};

		socket.on("newMessage", handleNewMessage);

		return () => socket.off("newMessage", handleNewMessage);
	}, [socket, setMessages, messages]);
};

export default useListenMessages;