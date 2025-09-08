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
            // --- START: CORRECTED CONNECTION LOGIC ---

            // Determine the correct backend URL based on the environment
            const SOCKET_URL = import.meta.env.MODE === 'production'
                ? "https://genchat-vi93.onrender.com"
                : "http://localhost:3000"; // Use your local backend port

            // Connect to the base URL, NOT the /api path
            const newSocket = io(SOCKET_URL, {
                query: {
                    userId: authUser._id,
                },
                // Recommended for reliability, especially in deployed environments
                transports: ['websocket']
            });

            // --- END: CORRECTED CONNECTION LOGIC ---

            setSocket(newSocket);

            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Clean up the socket connection
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
