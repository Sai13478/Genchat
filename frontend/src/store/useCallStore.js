import { create } from "zustand";
import toast from "react-hot-toast";

let peerConnection;

const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useCallStore = create((set, get) => ({
    incomingCallData: null,
    callAccepted: false,
    callStartTime: null,
    localStream: null,
    remoteStream: null,
    callState: "idle", // 'idle', 'ringing', 'calling', 'connected', 'failed'
    callType: null,
    callee: null,
    caller: null,
    callId: null,
    isScreenSharing: false,
    isMuted: false,
    isVideoEnabled: false,

    _createPeerConnection: (socket) => {
        if (peerConnection) {
            console.log("Closing old peer connection.");
            peerConnection.close();
        }
        peerConnection = new RTCPeerConnection(configuration);
        console.log("Created new peer connection.");

        // Log state changes for debugging
        peerConnection.onsignalingstatechange = () => {
            if (peerConnection) {
                console.log(`Signaling state change: ${peerConnection.signalingState}`);
            }
        };
        peerConnection.onconnectionstatechange = () => {
            if (peerConnection) {
                console.log(`Connection state change: ${peerConnection.connectionState}`);
            }
        };

        const { localStream } = get();
        if (localStream) {
            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream);
            });
        }

        peerConnection.ontrack = (event) => {
            console.log("Received remote stream");
            set({ remoteStream: event.streams[0] });
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const { callee, caller } = get();
                const otherUser = get().callState === "calling" ? callee : caller;
                if (otherUser) {
                    socket.emit("ice-candidate", {
                        to: otherUser._id,
                        candidate: event.candidate,
                    });
                }
            }
        };
    },

    setIncomingCallData: (callDetails) =>
        set({
            incomingCallData: callDetails,
            callState: "ringing",
            callType: callDetails.callType,
            caller: callDetails.from,
            callId: callDetails.callId,
        }),

    initiateCall: async (callee, socket, callType) => {
        set({ callState: "calling", callee, callType, isVideoEnabled: callType === "video" });
        get()._createPeerConnection(socket);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit("call-user", {
                to: callee._id,
                offer: offer,
                callType: callType,
            });
        } catch (error) {
            console.error("Error creating offer:", error);
            get().setCallFailed();
        }
    },

    answerCall: async (socket) => {
        const { incomingCallData } = get();
        if (!incomingCallData) return;

        const { callType } = incomingCallData;

        try {
            // 1. Get local stream for the receiver
            const videoConstraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
            };
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === "video" ? videoConstraints : false,
                audio: true,
            });

            // 2. Update state: set local stream, clear incoming call, and set state to connected
            set({
                localStream: stream,
                isVideoEnabled: callType === "video",
                incomingCallData: null,
                callState: "connected",
                callAccepted: true,
                callStartTime: Date.now(),
            });

            // 3. Create peer connection and answer the call
            get()._createPeerConnection(socket);

            await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit("answer-call", { to: incomingCallData.from._id, answer, callId: incomingCallData.callId });
        } catch (error) {
            console.error("Error answering call:", error);
            toast.error("Could not answer call. Please allow camera and microphone access.");
            get().declineCall(socket); // Decline if permissions are denied
        }
    },

    handleCallAccepted: async (answer) => {
        if (!peerConnection) {
            console.error("handleCallAccepted: peerConnection is not initialized!");
            return;
        }
        console.log(`Current signaling state: ${peerConnection.signalingState}. Attempting to set remote answer.`);
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            set({ callState: "connected", callAccepted: true, callStartTime: Date.now() });
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    },

    handleNewIceCandidate: async (candidate) => {
        if (peerConnection && candidate) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding received ICE candidate", error);
            }
        }
    },

    declineCall: (socket) => {
        const { incomingCallData } = get();
        if (incomingCallData) {
            socket.emit("decline-call", { to: incomingCallData.from._id, callId: incomingCallData.callId });
        }
        // Use hangup for cleanup, but don't emit a hangup event since it's a decline
        get().hangup(socket, false);
    },

    hangup: (socket, shouldEmit = true) => {
        if (shouldEmit) {
            const { callee, caller, callId } = get();
            const otherUser = callee || caller;
            if (otherUser) {
                socket.emit("hangup", { to: otherUser._id, callId });
            }
        }

        // Centralized cleanup logic
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
            console.log("Peer connection closed and cleaned up.");
        }

        get().resetCallState();
    },

    resetCallState: () => {
        const { localStream, remoteStream } = get();
        if (localStream) localStream.getTracks().forEach((track) => track.stop());
        if (remoteStream) remoteStream.getTracks().forEach((track) => track.stop());

        set({
            incomingCallData: null,
            callAccepted: false,
            callStartTime: null,
            localStream: null,
            remoteStream: null,
            callState: "idle",
            callType: null,
            callee: null,
            caller: null,
            callId: null,
            isScreenSharing: false,
            isMuted: false,
            isVideoEnabled: false,
        });
    },

    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),
    setCallId: (callId) => set({ callId }),
    toggleMute: () => {
        const { localStream, isMuted } = get();
        if (localStream) {
            const newMutedState = !isMuted;
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !newMutedState;
            });
            set({ isMuted: newMutedState });
        }
    },
    toggleVideo: () => {
        const { localStream, isVideoEnabled } = get();
        if (localStream) {
            const newVideoState = !isVideoEnabled;
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = newVideoState;
            });
            set({ isVideoEnabled: newVideoState });
        }
    },
    toggleScreenShare: async () => {
        const { isScreenSharing, localStream, callType } = get();

        if (callType !== "video" || !peerConnection) {
            console.warn("Screen sharing is only available for video calls and when a peer connection is active.");
            return;
        }

        if (isScreenSharing) {
            // --- STOP SCREEN SHARING & REVERT TO CAMERA ---
            try {
                // Request HD quality when switching back to the camera
                const videoConstraints = {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                };

                const cameraStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
                const cameraTrack = cameraStream.getVideoTracks()[0];

                const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(cameraTrack);
                }

                // Stop the old screen sharing track
                localStream.getVideoTracks().forEach((track) => track.stop());

                // Update local stream with camera video and existing audio
                const newStream = new MediaStream([cameraTrack, ...localStream.getAudioTracks()]);
                set({ localStream: newStream, isScreenSharing: false });
            } catch (error) {
                console.error("Error switching back to camera:", error);
                toast.error("Could not switch back to camera. Please check permissions.");
            }
        } else {
            // --- START SCREEN SHARING ---
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(screenTrack);
                }

                screenTrack.onended = () => {
                    if (get().isScreenSharing) get().toggleScreenShare();
                };

                localStream.getVideoTracks().forEach((track) => track.stop());

                const newStream = new MediaStream([screenTrack, ...localStream.getAudioTracks()]);
                set({ localStream: newStream, isScreenSharing: true });
            } catch (error) {
                console.error("Error starting screen share:", error);
                if (error.name !== "NotAllowedError" && error.name !== "NotFoundError") {
                    toast.error("Could not start screen sharing.");
                }
            }
        }
    },
    setCallFailed: (reason = "Call Failed") => {
        set({ callState: "failed" });
        setTimeout(() => {
            get().resetCallState();
        }, 2000);
    },
}));