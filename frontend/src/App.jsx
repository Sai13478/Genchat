import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components and Pages
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
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
import { useChatStore } from "./store/useChatStore";
import useListenMessages from "./hooks/useListenMessages";

function App() {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
    const { getFriendRequests, subscribeToMessages, unsubscribeFromMessages, selectedUser } = useChatStore();
    const { socket } = useSocket();
    const { theme, initializeTheme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize theme on mount
    useEffect(() => {
        initializeTheme();
    }, [initializeTheme]);

    // Start global message listening for notifications
    useListenMessages();

    // Destructure all necessary methods from the call store
    const {
        setIncomingCallData,
        handleCallAccepted,
        handleNewIceCandidate,
        hangup,
        handleRenegotiation,
        handleCallAnsweredElsewhere,
        handleCallDeclinedElsewhere,
        setCallId
    } = useCallStore();

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

        // Synchronize socket with call store for reliable signaling
        useCallStore.getState().setSocket(socket);

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
        socket.on("call-initiated", ({ callId }) => setCallId(callId));
        socket.on("user-offline", handleUserOffline);
        socket.on("call-declined", handleCallDeclined);
        socket.on("call-answered-elsewhere", handleCallAnsweredElsewhere);
        socket.on("call-declined-elsewhere", handleCallDeclinedElsewhere);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
            socket.off("call-initiated");
            socket.off("user-offline", handleUserOffline);
            socket.off("call-declined", handleCallDeclined);
            socket.off("call-answered-elsewhere", handleCallAnsweredElsewhere);
            socket.off("call-declined-elsewhere", handleCallDeclinedElsewhere);
        };
    }, [socket, navigate, setIncomingCallData, handleCallAnsweredElsewhere, handleCallDeclinedElsewhere]);

    // --- NEW: Effect for handling WebRTC specific signaling ---
    useEffect(() => {
        if (!socket) return;

        // Listener for when the callee accepts the call
        const onCallAccepted = ({ answer, callId }) => {
            handleCallAccepted(answer, callId);
        };

        // Listener for re-negotiation (e.g. screen share)
        const onRenegotiateCall = ({ offer }) => {
            handleRenegotiation(offer);
        };

        // Listener for receiving ICE candidates from the other peer
        const onIceCandidate = ({ candidate }) => {
            console.log(`Receiving ICE candidate from peer: ${candidate?.type || 'unknown'}`);
            handleNewIceCandidate(candidate);
        };

        // Listener for when the other user hangs up
        const onHangup = () => {
            hangup(); // This will reset the call state and clean up connections
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
        <div className="h-screen w-full flex flex-col nebula-mesh selection:bg-primary/30 selection:text-primary-content overflow-hidden" data-theme={theme}>
            {!authUser ? (
                <>
                    <Navbar />
                    <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
                        <Routes>
                            <Route path='/signup' element={<SignUpPage />} />
                            <Route path='/login' element={<LoginPage />} />
                            <Route path='*' element={<Navigate to="/login" />} />
                        </Routes>
                        <Toaster />
                    </div>
                </>
            ) : (
                <div className='flex h-screen w-full overflow-hidden bg-slate-900/60 backdrop-blur-2xl'>
                    {/* Sidebar Column - Only visible on desktop OR on mobile if not in a subview/chat */}
                    <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-slate-800/50 bg-slate-900/40 ${selectedUser || location.pathname !== '/' ? "hidden md:flex" : "flex"}`}>
                        <Sidebar />
                    </div>

                    {/* Content Column - Main action area */}
                    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${selectedUser || location.pathname !== '/' ? "flex" : "hidden md:flex"}`}>
                        <Routes>
                            <Route path='/' element={<HomePage />} />
                            <Route path='/call' element={<CallPage />} />
                            <Route path='/call-logs' element={<CallLogsPage />} />
                            <Route path='/profile' element={<ProfilePage />} />
                            <Route path='/settings' element={<SettingsPage />} />
                            <Route path='/call-failed' element={<CallFailedPage />} />
                            <Route path='*' element={<Navigate to="/" />} />
                        </Routes>
                        <Toaster />
                        <IncomingCallModal />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;