import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useCallback } from "react";
import CallLogsPage from "./pages/CallLogsPage"; 
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import CallPage from "./pages/CallPage";
import IncomingCallModal from "./components/IncomingCallModal";

import { useAuthStore } from "./store/useAuthStore";
import { useSocket } from "./context/SocketContext";
import useCallStore from "./store/useCallStore";

function App() {
	const { authUser, checkAuth } = useAuthStore();
	const { socket } = useSocket();
	const { setIncomingCallData, setCallState, resetCallState } = useCallStore();
	const navigate = useNavigate();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// Memoize event handlers to stabilize the useEffect dependency array
	const handleIncomingCall = useCallback(
		(data) => {
			setIncomingCallData(data);
			setCallState("ringing");
		},
		[setIncomingCallData, setCallState]
	);

	const handleCallAccepted = useCallback(
		async (data) => {
			const { peerConnection } = useCallStore.getState();
			if (peerConnection) {
				await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
			}
			setCallState("connected");
		},
		[setCallState]
	);

	const handleCallEnd = useCallback(() => {
		resetCallState();
		navigate("/");
	}, [resetCallState, navigate]);

	useEffect(() => {
		if (!socket) return;

		socket.on("incoming-call", handleIncomingCall);
		socket.on("call-accepted", handleCallAccepted);
		socket.on("call-declined", handleCallEnd);
		socket.on("hangup", handleCallEnd);

		return () => {
			socket.off("incoming-call", handleIncomingCall);
			socket.off("call-accepted", handleCallAccepted);
			socket.off("call-declined", handleCallEnd);
			socket.off("hangup", handleCallEnd);
		};
	}, [socket, handleIncomingCall, handleCallAccepted, handleCallEnd]);

	return (
		<div className='h-screen'>
			<Navbar />
			<div className='px-4 py-2.5 max-w-7xl mx-auto'>
				<Routes>
					<Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />} />
					<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
					<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
					<Route path='/call' element={authUser ? <CallPage /> : <Navigate to={"/login"} />} />
					<Route path='/call-logs' element={authUser ? <CallLogsPage /> : <Navigate to={"/login"} />} />
				</Routes>
				<Toaster />
				<IncomingCallModal />
			</div>
		</div>
	);
}

export default App;