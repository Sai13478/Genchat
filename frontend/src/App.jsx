import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components and Pages
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import CallPage from "./pages/CallPage";
import CallLogsPage from "./pages/CallLogsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CallFailedPage from "./pages/CallFailedPage";
import IncomingCallModal from "./components/IncomingCallModal";

// State and Context
import { useThemeStore } from "./store/useThemeStore";
import { useAuthStore } from "./store/useAuthStore";
import { useSocket } from "./context/SocketContext";
import { useCallStore } from "./store/useCallStore";
import useListenMessages from "./hooks/useListenMessages";

function App() {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
    const { getFriendRequests, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
    const { socket } = useSocket();
    const { theme } = useThemeStore();
    const navigate = useNavigate();

    // Start global message listening for notifications
    useListenMessages();

    // Destructure all necessary methods from the call store
    const { setIncomingCallData, handleCallAccepted, handleNewIceCandidate, hangup, handleRenegotiation } = useCallStore();

    // Effect for checking authentication status on initial load
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (authUser) {
            getFriendRequests();
            subscribeToMessages();
            return () => unsubscribeFromMessages();
        }
    }, [authUser, getFriendRequests, subscribeToMessages, unsubscribeFromMessages]);

    // Effect for handling standard call signaling (incoming, offline, declined)
    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            setIncomingCallData(data);
        };

        const handleUserOffline = ({ userId }) => {
            console.log(`Call failed: User ${userId} is offline.`);
            navigate("/call-failed", { state: { reason: "The user you are trying to call is offline." } });
        };

        const handleCallDeclined = () => {
            navigate("/call-failed", { state: { reason: "The user declined your call." } });
        };

        socket.on("incoming-call", handleIncomingCall);
        socket.on("user-offline", handleUserOffline);
        socket.on("call-declined", handleCallDeclined);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
            socket.off("user-offline", handleUserOffline);
            socket.off("call-declined", handleCallDeclined);
        };
    }, [socket, navigate, setIncomingCallData]);

    // --- NEW: Effect for handling WebRTC specific signaling ---
    useEffect(() => {
        if (!socket) return;

        // Listener for when the callee accepts the call
        const onCallAccepted = ({ answer }) => {
            handleCallAccepted(answer);
        };

        // Listener for re-negotiation (e.g. screen share)
        const onRenegotiateCall = ({ offer }) => {
            handleRenegotiation(offer, socket);
        };

        // Listener for receiving ICE candidates from the other peer
        const onIceCandidate = ({ candidate }) => {
            handleNewIceCandidate(candidate);
        };

        // Listener for when the other user hangs up
        const onHangup = () => {
            hangup(socket); // This will reset the call state and clean up connections
        };

        socket.on("call-accepted", onCallAccepted);
        socket.on("renegotiate-call", onRenegotiateCall);
        socket.on("ice-candidate", onIceCandidate);
        socket.on("hangup", onHangup);

        return () => {
            socket.off("call-accepted", onCallAccepted);
            socket.off("renegotiate-call", onRenegotiateCall);
            socket.off("ice-candidate", onIceCandidate);
            socket.off("hangup", onHangup);
        };
    }, [socket, handleCallAccepted, handleNewIceCandidate, hangup, handleRenegotiation]);

    // Loading screen while checking auth
    if (isCheckingAuth) {
        return (
            <div className='h-screen flex justify-center items-center'>
                <span className='loading loading-lg'></span>
            </div>
        );
    }

    return (
        <div data-theme={theme}>
            <Navbar />
            <div className='h-screen flex items-center justify-center'>
                <Routes>
                    <Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />} />
                    <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
                    <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
                    <Route path='/call' element={authUser ? <CallPage /> : <Navigate to={"/login"} />} />
                    <Route path='/call-logs' element={authUser ? <CallLogsPage /> : <Navigate to={"/login"} />} />
                    <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />} />
                    <Route path='/settings' element={authUser ? <SettingsPage /> : <Navigate to={"/login"} />} />
                    <Route path='/call-failed' element={authUser ? <CallFailedPage /> : <Navigate to={"/login"} />} />
                </Routes>
                <Toaster />
                <IncomingCallModal />
            </div>
        </div>
    );
}

export default App;