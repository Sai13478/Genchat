import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";

const useListenTyping = () => {
	const { socket } = useSocket();
	const { selectedUser, setTyping } = useChatStore();

	useEffect(() => {
		if (!socket) return;

		const handleTyping = ({ from }) => {
			if (from === selectedUser?._id) setTyping(true);
		};

		const handleStopTyping = ({ from }) => {
			if (from === selectedUser?._id) setTyping(false);
		};

		socket.on("typing", handleTyping);
		socket.on("stop-typing", handleStopTyping);

		return () => {
			socket.off("typing", handleTyping);
			socket.off("stop-typing", handleStopTyping);
		};
	}, [socket, selectedUser, setTyping]);
};

export default useListenTyping;