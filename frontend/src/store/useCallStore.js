import { create } from "zustand";
import toast from "react-hot-toast";

let peerConnection;
let makingOffer = false;

const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ],
    iceCandidatePoolSize: 10,
};

export const useCallStore = create((set, get) => ({
    iceCandidateQueue: [],
    availableOutputDevices: [],
    selectedOutputDeviceId: "default",

    _processIceCandidateQueue: async () => {
        const { iceCandidateQueue } = get();
        if (!peerConnection || !peerConnection.remoteDescription) return;

        console.log(`Processing ${iceCandidateQueue.length} queued ICE candidates.`);
        for (const candidate of iceCandidateQueue) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding queued ICE candidate:", error);
            }
        }
        set({ iceCandidateQueue: [] });
    },

    _createPeerConnection: (socket) => {
        if (peerConnection) {
            console.log("Closing old peer connection.");
            peerConnection.close();
        }
        peerConnection = new RTCPeerConnection(configuration);
        console.log("Created new peer connection.");
        set({ iceCandidateQueue: [] }); // Reset queue for new connection

        // ... existing state change logs ...
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

        peerConnection.onnegotiationneeded = async () => {
            try {
                if (makingOffer || peerConnection.signalingState !== "stable") return;
                makingOffer = true;
                console.log("Negotiation needed.");
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                const { callee, caller, callId, callState, callType } = get();
                const otherUser = callState === "calling" ? callee : caller;
                if (otherUser) {
                    if (callState === "calling") {
                        socket.emit("call-user", {
                            to: otherUser._id,
                            offer: offer,
                            callType: callType,
                        });
                    } else {
                        socket.emit("renegotiate-call", {
                            to: otherUser._id,
                            offer: offer,
                            callId
                        });
                    }
                }
            } catch (err) {
                console.error("Error during negotiation:", err);
            } finally {
                makingOffer = false;
            }
        };

        peerConnection.ontrack = (event) => {
            console.log("Received remote track:", event.track.kind);

            set((state) => {
                const currentStream = state.remoteStream || new MediaStream();

                // Add the track to the stream if it's not already there
                if (!currentStream.getTracks().find(t => t.id === event.track.id)) {
                    currentStream.addTrack(event.track);
                    console.log(`Track ${event.track.id} (${event.track.kind}) added to remote stream.`);
                }

                // Force a new MediaStream object to trigger React re-renders if necessary, 
                // but keep the same tracks.
                return { remoteStream: new MediaStream(currentStream.getTracks()) };
            });
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const { callee, caller, callId } = get();
                const otherUser = get().callState === "calling" ? callee : caller;
                if (otherUser) {
                    socket.emit("ice-candidate", {
                        to: otherUser._id,
                        candidate: event.candidate,
                        callId
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

        const { localStream } = get();
        if (localStream) {
            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream);
            });
        }
    },

    answerCall: async (socket) => {
        const { incomingCallData } = get();
        if (!incomingCallData) return;

        const { callType } = incomingCallData;

        try {
            // Relaxed constraints for better compatibility on all devices
            const videoConstraints = callType === "video" ? {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : false;

            console.log("Requesting getUserMedia with constraints:", { video: videoConstraints, audio: true });
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true,
            });
            console.log("Successfully obtained local stream.");

            set({
                localStream: stream,
                isVideoEnabled: callType === "video",
                incomingCallData: null,
                callState: "connected",
                callAccepted: true,
                callStartTime: Date.now(),
            });

            get()._createPeerConnection(socket);

            await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));

            // Process queued candidates now that remoteDescription is set
            await get()._processIceCandidateQueue();

            if (stream) {
                console.log(`Adding ${stream.getTracks().length} tracks to peer connection.`);
                stream.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, stream);
                    console.log(`Added ${track.kind} track.`);
                });
            }

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit("answer-call", { to: incomingCallData.from._id, answer, callId: incomingCallData.callId });
        } catch (error) {
            console.error("Error answering call:", error);
            toast.error("Could not answer call. Please allow camera and microphone access.");
            get().declineCall(socket);
        }
    },

    handleCallAccepted: async (answer, callId) => {
        if (!peerConnection) return;
        try {
            console.log(`Call accepted. Syncing Call ID: ${callId}`);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            set({ callState: "connected", callAccepted: true, callStartTime: Date.now(), callId });

            // Process queued candidates
            await get()._processIceCandidateQueue();
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    },

    handleRenegotiation: async (offer, socket) => {
        if (!peerConnection) return;
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            await get()._processIceCandidateQueue();

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            const { callee, caller, callId } = get();
            const otherUser = callee || caller;
            if (otherUser) {
                socket.emit("answer-call", { to: otherUser._id, answer, callId });
            }
        } catch (error) {
            console.error("Error during renegotiation response:", error);
        }
    },

    handleNewIceCandidate: async (candidate) => {
        if (!peerConnection || !peerConnection.remoteDescription) {
            set((state) => ({ iceCandidateQueue: [...state.iceCandidateQueue, candidate] }));
            return;
        }
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error("Error adding received ICE candidate", error);
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

        makingOffer = false; // Reset module-level state

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
            iceCandidateQueue: [],
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

    handleCallAnsweredElsewhere: () => {
        console.log("Call answered on another device. Resetting state.");
        get().resetCallState();
    },

    handleCallDeclinedElsewhere: () => {
        console.log("Call declined on another device. Resetting state.");
        get().resetCallState();
    },

    getOutputDevices: async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
            set({ availableOutputDevices: audioOutputs });
        } catch (error) {
            console.error("Error enumerating output devices:", error);
        }
    },

    setAudioOutput: async (deviceId) => {
        set({ selectedOutputDeviceId: deviceId });
        // The actual logic to apply this to audio/video elements will be in the component
        // because setSinkId is called on the DOM element.
    },
}));