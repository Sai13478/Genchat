import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";

// Request notification permission once
const requestNotificationPermission = () => {
	if ("Notification" in window && Notification.permission === "default") {
		Notification.requestPermission();
	}
};

const useListenMessages = () => {
	const { socket } = useSocket();
	const { messages, setMessages, selectedUser } = useChatStore();

	// Request permission on mount
	useEffect(() => {
		requestNotificationPermission();
	}, []);

	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (newMessage) => {
			setMessages([...messages, newMessage]);

			// Show browser notification if tab is not focused
			// and the message is not from the currently open chat
			if (document.hidden || selectedUser?._id !== newMessage.senderId) {
				showNotification(newMessage);
			}
		};

		socket.on("newMessage", handleNewMessage);

		return () => socket.off("newMessage", handleNewMessage);
	}, [socket, setMessages, messages, selectedUser]);
};

const showNotification = (message) => {
	if ("Notification" in window && Notification.permission === "granted") {
		const body = message.text
			? message.text.substring(0, 100)
			: "Sent an image";

		const notification = new Notification("New Message", {
			body: body,
			icon: message.senderProfilePic || "/avatar.png",
			tag: `msg-${message.senderId}`, // Replaces previous notification from same user
		});

		// Close notification after 4 seconds
		setTimeout(() => notification.close(), 4000);

		// Focus the tab when notification is clicked
		notification.onclick = () => {
			window.focus();
			notification.close();
		};
	}

	// Play notification sound
	try {
		const audio = new Audio("/notification.mp3");
		audio.volume = 0.3;
		audio.play().catch(() => { }); // Ignore autoplay errors
	} catch (e) {
		// Ignore if audio fails
	}
};

export default useListenMessages;