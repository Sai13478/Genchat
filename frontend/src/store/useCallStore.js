import { create } from "zustand";
import toast from "react-hot-toast";
import { playIncomingRingtone, playOutgoingRingtone, stopRingtone } from "../utils/callSounds.js";

let peerConnection;
let localStream;

const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useCallStore = create((set, get) => ({
    incomingCallData: null,
    callAccepted: false,
    callStartTime: null,
    remoteStream: null,
    callState: "idle", // 'idle', 'ringing', 'calling', 'connected', 'failed'
    callType: null,
    callee: null,
    caller: null,
    callId: null,
    isMuted: false,
    isVideoEnabled: true,
    iceCandidateQueue: [],

    // --- Helpers ---
    _getMediaStream: async (type) => {
        try {
            const videoConstraints = type === "video" ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
            } : false;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true,
            });
            localStream = stream;
            set({ isVideoEnabled: type === "video" });
            return stream;
        } catch (error) {
            console.error("Error getting media stream:", error);
            toast.error("Camera/Mic access denied. Please check permissions.");
            return null;
        }
    },

    _createPeerConnection: (socket) => {
        if (peerConnection) {
            peerConnection.close();
        }
        peerConnection = new RTCPeerConnection(configuration);

        if (localStream) {
            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream);
            });
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const { callee, caller, callState } = get();
                const otherUser = callState === "calling" ? callee : caller;
                if (otherUser) {
                    socket.emit("ice-candidate", {
                        to: otherUser._id,
                        candidate: event.candidate,
                        callId: get().callId,
                    });
                }
            }
        };

        peerConnection.ontrack = (event) => {
            set({ remoteStream: event.streams[0] });
        };

        peerConnection.onconnectionstatechange = () => {
            if (peerConnection) {
                if (peerConnection.connectionState === "connected") {
                    set({ callState: "connected", callAccepted: true, callStartTime: Date.now() });
                }
                if (["failed", "disconnected"].includes(peerConnection.connectionState)) {
                    get().hangup(socket);
                }
            }
        };
    },

    // --- Public Actions ---
    setIncomingCallData: (callDetails) => {
        playIncomingRingtone();
        set({
            incomingCallData: callDetails,
            callState: "ringing",
            callType: callDetails.callType,
            caller: callDetails.from,
            callId: callDetails.callId,
        });
    },

    initiateCall: async (callee, socket, callType) => {
        const stream = await get()._getMediaStream(callType);
        if (!stream) return;

        playOutgoingRingtone();
        set({ callState: "calling", callee, callType });
        get()._createPeerConnection(socket);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("call-user", { to: callee._id, offer, callType });
        } catch (error) {
            console.error("Error creating offer:", error);
            get().hangup(socket);
        }
    },

    answerCall: async (socket) => {
        stopRingtone();
        const { incomingCallData } = get();
        if (!incomingCallData) return;

        const stream = await get()._getMediaStream(incomingCallData.callType);
        if (!stream) return get().declineCall(socket);

        set({ incomingCallData: null });
        get()._createPeerConnection(socket);

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
            get().iceCandidateQueue.forEach((c) => peerConnection.addIceCandidate(new RTCIceCandidate(c)));
            set({ iceCandidateQueue: [] });

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer-call", { to: incomingCallData.from._id, answer, callId: incomingCallData.callId });
        } catch (error) {
            console.error("Error answering call:", error);
            get().hangup(socket);
        }
    },

    handleCallAccepted: async (answer) => {
        stopRingtone();
        if (!peerConnection || peerConnection.signalingState !== "have-local-offer") return;
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            get().iceCandidateQueue.forEach((c) => peerConnection.addIceCandidate(new RTCIceCandidate(c)));
            set({ iceCandidateQueue: [] });
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    },

    handleNewIceCandidate: async (candidate) => {
        if (peerConnection && candidate) {
            try {
                if (!peerConnection.remoteDescription) {
                    set((state) => ({ iceCandidateQueue: [...state.iceCandidateQueue, candidate] }));
                } else {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        }
    },

    declineCall: (socket) => {
        stopRingtone();
        const { incomingCallData } = get();
        if (incomingCallData) {
            socket.emit("decline-call", { to: incomingCallData.from._id, callId: incomingCallData.callId });
        }
        get()._cleanup();
    },

    hangup: (socket) => {
        stopRingtone();
        const { callee, caller, callId } = get();
        const otherUser = callee || caller;
        if (otherUser) {
            socket.emit("hangup", { to: otherUser._id, callId });
        }
        get()._cleanup();
    },

    _cleanup: () => {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
            localStream = null;
        }
        set({
            incomingCallData: null,
            callAccepted: false,
            callStartTime: null,
            remoteStream: null,
            callState: "idle",
            callType: null,
            callee: null,
            caller: null,
            callId: null,
            iceCandidateQueue: [],
            isMuted: false,
            isVideoEnabled: true,
        });
    },

    toggleMute: () => {
        const { isMuted } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
            set({ isMuted: !isMuted });
        }
    },

    toggleVideo: () => {
        const { isVideoEnabled } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoEnabled));
            set({ isVideoEnabled: !isVideoEnabled });
        }
    },
}));
