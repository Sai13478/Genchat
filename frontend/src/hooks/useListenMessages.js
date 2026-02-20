import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// Request notification permission once
const requestNotificationPermission = () => {
	if ("Notification" in window && Notification.permission === "default") {
		Notification.requestPermission();
	}
};

const useListenMessages = () => {
	const { socket } = useSocket();
	const { setMessages, selectedUser } = useChatStore();
	const { authUser } = useAuthStore();

	// Request permission on mount
	useEffect(() => {
		requestNotificationPermission();
	}, []);

	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (newMessage) => {
			const { selectedUser, setMessages, users, setUsers } = useChatStore.getState();

			// 1. Only update the selectedUser's message list if the sender matches
			if (selectedUser?._id === newMessage.senderId) {
				const currentMessages = useChatStore.getState().messages;
				setMessages([...currentMessages, newMessage]);
			}

			// 2. Move the sender to the top of the user list for recency
			const sender = users.find(u => u._id === newMessage.senderId);
			if (sender) {
				const updatedUsers = users.filter(u => u._id !== newMessage.senderId);
				setUsers([sender, ...updatedUsers]);
			}

			// 3. Show notification if NOT from the active user (double safety)
			// AND (tab is hidden OR it's from a different chat)
			if (newMessage.senderId !== authUser?._id) {
				if (document.hidden || selectedUser?._id !== newMessage.senderId) {
					showNotification(newMessage);
				}
			}
		};

		socket.on("newMessage", handleNewMessage);

		return () => socket.off("newMessage", handleNewMessage);
	}, [socket, selectedUser, authUser]);
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