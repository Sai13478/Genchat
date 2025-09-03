import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthStore();

    useEffect(() => {
        if (authUser) {
            const newSocket = io(import.meta.env.VITE_API_URL, {
                query: {
                    userId: authUser._id,
                },
                // Use WebSockets first, and disable long-polling fallbacks if you want to ensure a pure WebSocket connection
                transports: ["websocket"],
            });

            setSocket(newSocket);

            newSocket.on("connect", () => {
                console.log("✅ Socket connected successfully:", newSocket.id);
            });

            // Listen for online users update
            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Cleanup function to close the socket when the component unmounts or user logs out
            return () => {
                console.log("🔌 Closing socket connection.");
                newSocket.close();
            };
        } else {
            // If there is no authenticated user, close any existing socket
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser]);

    return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};