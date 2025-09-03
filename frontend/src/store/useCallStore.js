import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

const useCallStore = create((set, get) => ({
	callState: "idle", // idle, calling, ringing, connected, failed
	localStream: null,
	remoteStream: null,
	peerConnection: null,
	callId: null,
	callType: "video",
	callStartTime: null,
	caller: null,
	callee: null,
	incomingCallData: null,
	isScreenSharing: false,
	isMuted: false,
	cameraStream: null, // To store the original camera stream

	setCallState: (callState) => set({ callState }),
	setIncomingCallData: (data) => set({ incomingCallData: data }),
	setCallConnected: () => set({ callState: "connected", callStartTime: Date.now() }),

	initiateCall: async (callee, socket, authUser, callType) => {
		set({ callState: "calling", callee, caller: authUser, callType });
		const callId = uuidv4();
		set({ callId });

		try {
			const constraints = {
				audio: true,
				video: callType === "video",
			};
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			set({ localStream: stream, cameraStream: stream }); // Store original stream
			set({ localStream: stream });

			const pc = new RTCPeerConnection({
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
			});
			set({ peerConnection: pc });

			stream.getTracks().forEach((track) => pc.addTrack(track, stream));

			pc.onicecandidate = (event) => {
				if (event.candidate) {
					socket.emit("ice-candidate", { to: callee._id, candidate: event.candidate, callId });
				}
			};

			pc.ontrack = (event) => {
				set({ remoteStream: event.streams[0] });
			};

			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			socket.emit("call-user", { to: callee._id, offer, callId, callType });
		} catch (error) {
			console.error("Error initiating call:", error.name, error.message);
			if (error.name === "NotReadableError" || error.name === "OverconstrainedError") {
				toast.error("Could not access camera/microphone. Is it already in use by another application?");
			} else {
				toast.error("Could not start the call. Please check permissions.");
			}
			set({ callState: "failed" }); // Set state to failed
			get().resetCallState();
		}
	},

	answerCall: async (socket) => {
		const { incomingCallData } = get();
		if (!incomingCallData) return;

		const callType = incomingCallData.callType;
		set({
			callState: "connected",
			caller: incomingCallData.from,
			callee: useAuthStore.getState().authUser,
			callType,
			callStartTime: Date.now(),
		});

		try {
			const constraints = { audio: true, video: callType === "video" };
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			set({ localStream: stream });

			const pc = new RTCPeerConnection({
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
			});
			set({ peerConnection: pc });

			stream.getTracks().forEach((track) => pc.addTrack(track, stream));

			pc.onicecandidate = (event) => {
				if (event.candidate) {
					socket.emit("ice-candidate", { to: incomingCallData.from._id, candidate: event.candidate, callId: incomingCallData.callId });
				}
			};

			pc.ontrack = (event) => {
				set({ remoteStream: event.streams[0] });
			};

			await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			socket.emit("answer-call", { to: incomingCallData.from._id, answer, callId: incomingCallData.callId });
			set({ incomingCallData: null }); // Clear incoming call data after answering
		} catch (error) {
			console.error("Error answering call:", error.name, error.message);
			if (error.name === "NotReadableError" || error.name === "OverconstrainedError") {
				toast.error("Could not access camera/microphone. Is it already in use by another tab or application?");
			} else {
				toast.error("Could not answer the call. Please check permissions.");
			}
			get().resetCallState();
		}
	},

	declineCall: (socket) => {
		const { incomingCallData } = get();
		if (incomingCallData) {
			socket.emit("decline-call", { to: incomingCallData.from._id, callId: incomingCallData.callId });
		}
		get().resetCallState();
	},

	hangup: (socket) => {
		const { caller, callee } = get();
		const { authUser } = useAuthStore.getState();

		if (!authUser) {
			console.error("Hangup failed: Authenticated user not found.");
			get().resetCallState(); // Still reset the call state to clean up
			return;
		}
		const otherUser = authUser._id === caller?._id ? callee : caller;
		if (otherUser) {
			socket.emit("hangup", { to: otherUser._id, callId: get().callId });
		}
		get().resetCallState();
	},

	resetCallState: () => {
		get().peerConnection?.close();
		get().localStream?.getTracks().forEach((track) => track.stop());
		set({
			callState: "idle",
			localStream: null,
			remoteStream: null,
			peerConnection: null,
			callId: null,
			callType: "video",
			callStartTime: null,
			caller: null,
			callee: null,
			incomingCallData: null,
			isScreenSharing: false,
			isMuted: false,
			cameraStream: null,
		});
	},

	toggleScreenShare: async (isSharing) => {
		const { peerConnection, localStream, cameraStream } = get();
		if (!peerConnection) return;

		if (isSharing) {
			// Stop screen sharing and revert to camera
			const videoTrack = cameraStream.getVideoTracks()[0];
			const sender = peerConnection.getSenders().find((s) => s.track.kind === "video");
			if (sender) {
				sender.replaceTrack(videoTrack);
			}
			localStream.getTracks().forEach((track) => {
				if (track.kind !== "video") track.stop();
			});
			set({ localStream: cameraStream, isScreenSharing: false });
		} else {
			// Start screen sharing
			const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
			const screenTrack = screenStream.getVideoTracks()[0];

			const sender = peerConnection.getSenders().find((s) => s.track.kind === "video");
			if (sender) {
				sender.replaceTrack(screenTrack);
			}

			// When the user stops sharing via the browser's native UI
			screenTrack.onended = () => {
				get().toggleScreenShare(true); // Revert to camera
			};

			set({ localStream: screenStream, isScreenSharing: true });
		}
	},

	toggleMute: () => {
		const { localStream, isMuted } = get();
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				set({ isMuted: !isMuted });
			}
		}
	},
}));

export default useCallStore;