import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import io from "socket.io-client";

const SocketContext = createContext();

// This custom hook provides an easy way to access the socket context.
export const useSocket = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthStore();

	useEffect(() => {
		if (authUser) {
			// In dev: empty string uses window.location.origin (Vite proxy handles /socket.io)
			// In prod: connect to VITE_BACKEND_URL
			let backendUrl = "";

			if (import.meta.env.PROD) {
				backendUrl = import.meta.env.VITE_BACKEND_URL;
				// Sanity check for production
				if (!backendUrl || backendUrl === "undefined" || !backendUrl.startsWith("http")) {
					backendUrl = "https://genchat-vi93.onrender.com";
					console.warn("VITE_BACKEND_URL is invalid or missing in production. Falling back to hardcoded Render URL.");
				}
			}

			const newSocket = io(backendUrl, {
				query: {
					userId: authUser._id,
				},
				transports: ['websocket', 'polling'], // Prioritize websocket
				withCredentials: true, // Ensure cookies are sent for auth
			});

			setSocket(newSocket);

			newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			// Clean up the socket connection when the component unmounts or authUser changes
			return () => newSocket.close();
		} else {
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authUser]);

	return <SocketContext.Provider value={{ socket, onlineUsers, setOnlineUsers }}>{children}</SocketContext.Provider>;
};
