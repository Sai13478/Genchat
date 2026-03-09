import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";

const useListenTyping = () => {
	const { socket } = useSocket();
	const { selectedUser, setTypingUsers } = useChatStore();

	useEffect(() => {
		if (!socket) return;

		const handleTyping = ({ from, username, to }) => {
			// If it's a direct chat or if I'm in the group the event was sent to
			if (from === selectedUser?._id || to === selectedUser?._id) {
				setTypingUsers(from, username, true);
			}
		};

		const handleStopTyping = ({ from, to }) => {
			if (from === selectedUser?._id || to === selectedUser?._id) {
				setTypingUsers(from, null, false);
			}
		};

		socket.on("typing", handleTyping);
		socket.on("stop-typing", handleStopTyping);

		return () => {
			socket.off("typing", handleTyping);
			socket.off("stop-typing", handleStopTyping);
		};
	}, [socket, selectedUser, setTypingUsers]);
};

export default useListenTyping;