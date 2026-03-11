import { create } from "zustand";
import toast from "react-hot-toast";
import AgoraRTC from "agora-rtc-sdk-ng";
import apiClient from "../lib/apiClient";

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

// Agora client instance (singleton)
let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;

const getAgoraClient = () => {
    if (!agoraClient) {
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }
    return agoraClient;
};

// Fetch a temporary token from our backend
const fetchAgoraToken = async (channelName) => {
    try {
        const res = await apiClient.get(`/agora/token?channelName=${channelName}`);
        return res.data;
    } catch (error) {
        console.error("Failed to fetch Agora token:", error);
        return null;
    }
};

export const useCallStore = create((set, get) => ({
    availableOutputDevices: [],
    selectedOutputDeviceId: "default",
    socket: null,
    connectionStatus: "idle", // 'idle', 'connecting', 'connected', 'failed', 'disconnected'

    setSocket: (socket) => set({ socket }),

    setIncomingCallData: (callDetails) =>
        set({
            incomingCallData: callDetails,
            callState: "ringing",
            callType: callDetails.callType,
            caller: callDetails.from,
            callId: callDetails.callId,
        }),

    // ──────────────────────────────────────────────────────────────
    //  CALLER: Initiate a call
    // ──────────────────────────────────────────────────────────────
    initiateCall: async (callee, callType) => {
        set({ callState: "calling", callee, callType, isVideoEnabled: callType === "video" });
        const { socket } = get();

        // Create local tracks FIRST so UI can show preview
        try {
            if (callType === "video") {
                [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                    {},
                    { encoderConfig: "720p_2" }
                );
            } else {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localVideoTrack = null;
            }

            // Build a MediaStream for the local preview
            const previewStream = new MediaStream();
            if (localAudioTrack) previewStream.addTrack(localAudioTrack.getMediaStreamTrack());
            if (localVideoTrack) previewStream.addTrack(localVideoTrack.getMediaStreamTrack());
            set({ localStream: previewStream });

        } catch (err) {
            console.error("Failed to get local media:", err);
            toast.error("Could not access camera/microphone. Please check permissions.");
            get().resetCallState();
            return;
        }

        // Ask the signaling server to ring the callee
        if (socket) {
            socket.emit("call-user", {
                to: callee._id,
                offer: {}, // No SDP needed — Agora handles media
                callType,
            });
        }
    },

    // ──────────────────────────────────────────────────────────────
    //  CALLEE: Answer incoming call
    // ──────────────────────────────────────────────────────────────
    answerCall: async () => {
        const { incomingCallData } = get();
        if (!incomingCallData) return;

        const { callType, callId } = incomingCallData;

        try {
            // Create local tracks
            if (callType === "video") {
                [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                    {},
                    { encoderConfig: "720p_2" }
                );
            } else {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localVideoTrack = null;
            }

            // Safety check: Did we cancel while waiting for camera?
            if (get().callState === "idle") {
                console.log("Call aborted while waiting for media.");
                localAudioTrack?.close();
                localVideoTrack?.close();
                return;
            }

            const previewStream = new MediaStream();
            if (localAudioTrack) previewStream.addTrack(localAudioTrack.getMediaStreamTrack());
            if (localVideoTrack) previewStream.addTrack(localVideoTrack.getMediaStreamTrack());

            set({
                localStream: previewStream,
                isVideoEnabled: callType === "video",
                incomingCallData: null,
                callState: "connected",
                callAccepted: true,
                callStartTime: Date.now(),
            });

            // Join the Agora channel using the callId as the channel name
            const channelName = callId || `call-${Date.now()}`;
            await get()._joinAgoraChannel(channelName);

            // Notify the caller that we accepted
            const { socket } = get();
            if (socket) {
                socket.emit("answer-call", {
                    to: incomingCallData.from._id,
                    answer: { channelName }, // Send channel name instead of SDP
                    callId: incomingCallData.callId,
                });
            }
        } catch (error) {
            console.error("Error answering call:", error);
            toast.error("Could not answer call. Please allow camera and microphone access.");
            get().declineCall();
        }
    },

    // ──────────────────────────────────────────────────────────────
    //  CALLER: Handle call accepted — join Agora channel
    // ──────────────────────────────────────────────────────────────
    handleCallAccepted: async (answer, callId) => {
        try {
            console.log(`Call accepted. Joining Agora channel for Call ID: ${callId}`);
            const channelName = answer?.channelName || callId;
            set({ callState: "connected", callAccepted: true, callStartTime: Date.now(), callId });
            await get()._joinAgoraChannel(channelName);
        } catch (error) {
            console.error("Error joining Agora channel:", error);
            toast.error("Failed to connect to call.");
            get().hangup();
        }
    },

    // ──────────────────────────────────────────────────────────────
    //  INTERNAL: Join Agora channel, publish tracks, subscribe to remote
    // ──────────────────────────────────────────────────────────────
    _joinAgoraChannel: async (channelName) => {
        const client = getAgoraClient();
        set({ connectionStatus: "connecting" });

        // Fetch token from backend
        const tokenData = await fetchAgoraToken(channelName);
        const token = tokenData?.token || null;

        console.log(`Joining Agora channel: ${channelName}`);

        // Subscribe to remote user events BEFORE joining
        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            console.log(`Subscribed to remote user ${user.uid}, mediaType: ${mediaType}`);

            if (mediaType === "video") {
                const remoteVideoTrack = user.videoTrack;
                if (remoteVideoTrack) {
                    const remoteStream = new MediaStream([remoteVideoTrack.getMediaStreamTrack()]);
                    // Also add audio if available
                    const currentRemote = get().remoteStream;
                    if (currentRemote) {
                        currentRemote.getAudioTracks().forEach(t => remoteStream.addTrack(t));
                    }
                    set({ remoteStream: remoteStream });
                }
            }
            if (mediaType === "audio") {
                const remoteAudioTrack = user.audioTrack;
                if (remoteAudioTrack) {
                    remoteAudioTrack.play(); // Play audio automatically
                    const currentRemote = get().remoteStream;
                    if (currentRemote) {
                        const newStream = new MediaStream(currentRemote.getTracks());
                        newStream.addTrack(remoteAudioTrack.getMediaStreamTrack());
                        set({ remoteStream: newStream });
                    } else {
                        set({ remoteStream: new MediaStream([remoteAudioTrack.getMediaStreamTrack()]) });
                    }
                }
            }
        });

        client.on("user-unpublished", (user, mediaType) => {
            console.log(`Remote user ${user.uid} unpublished ${mediaType}`);
        });

        client.on("user-left", () => {
            console.log("Remote user left the channel.");
        });

        client.on("connection-state-change", (curState) => {
            console.log(`Agora connection state: ${curState}`);
            if (curState === "CONNECTED") {
                set({ connectionStatus: "connected" });
            } else if (curState === "DISCONNECTED") {
                set({ connectionStatus: "disconnected" });
            } else if (curState === "RECONNECTING") {
                set({ connectionStatus: "connecting" });
            }
        });

        try {
            // Join channel — uid 0 means Agora assigns a dynamic UID
            await client.join(AGORA_APP_ID, channelName, token, 0);
            console.log("Successfully joined Agora channel.");

            // Publish local tracks
            const tracksToPublish = [localAudioTrack, localVideoTrack].filter(Boolean);
            if (tracksToPublish.length > 0) {
                await client.publish(tracksToPublish);
                console.log(`Published ${tracksToPublish.length} local tracks.`);
            }

            set({ connectionStatus: "connected" });
        } catch (error) {
            console.error("Failed to join Agora channel:", error);
            set({ connectionStatus: "failed" });
            toast.error("Failed to connect to call. Please try again.");
        }
    },

    // ──────────────────────────────────────────────────────────────
    //  ICE candidate handling — NOT NEEDED with Agora (noop)
    // ──────────────────────────────────────────────────────────────
    handleNewIceCandidate: async () => { /* No-op: Agora handles connectivity */ },
    handleRenegotiation: async () => { /* No-op: Agora handles renegotiation */ },

    // ──────────────────────────────────────────────────────────────
    //  Decline / Hangup / Reset
    // ──────────────────────────────────────────────────────────────
    declineCall: () => {
        const { incomingCallData, socket } = get();
        if (incomingCallData && socket) {
            socket.emit("decline-call", { to: incomingCallData.from._id, callId: incomingCallData.callId });
        }
        get().hangup(false);
    },

    hangup: (shouldEmit = true) => {
        const { socket } = get();
        if (shouldEmit && socket) {
            const { callee, caller, callId } = get();
            const otherUser = callee || caller;
            if (otherUser) {
                socket.emit("hangup", { to: otherUser._id, callId });
            }
        }

        // Leave Agora channel and close local tracks
        if (agoraClient) {
            agoraClient.leave().catch(e => console.warn("Agora leave error:", e));
            agoraClient.removeAllListeners();
            agoraClient = null;
        }
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        if (localVideoTrack) {
            localVideoTrack.close();
            localVideoTrack = null;
        }

        console.log("Agora call cleaned up.");
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
            iceCandidateQueue: [],
            connectionStatus: "idle",
        });
    },

    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),
    setCallId: (callId) => set({ callId }),

    toggleMute: () => {
        const { isMuted } = get();
        const newMutedState = !isMuted;
        if (localAudioTrack) {
            localAudioTrack.setEnabled(!newMutedState);
        }
        set({ isMuted: newMutedState });
    },

    toggleVideo: () => {
        const { isVideoEnabled } = get();
        const newVideoState = !isVideoEnabled;
        if (localVideoTrack) {
            localVideoTrack.setEnabled(newVideoState);
        }
        set({ isVideoEnabled: newVideoState });
    },

    toggleScreenShare: async () => {
        const { isScreenSharing, callType } = get();
        const client = getAgoraClient();

        if (callType !== "video" || !client) {
            console.warn("Screen sharing is only available for video calls.");
            return;
        }

        if (isScreenSharing) {
            // Stop screen sharing — switch back to camera
            try {
                const newCameraTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_2" });
                await client.unpublish(localVideoTrack);
                localVideoTrack?.close();
                localVideoTrack = newCameraTrack;
                await client.publish(localVideoTrack);

                // Update local preview
                const previewStream = new MediaStream();
                if (localAudioTrack) previewStream.addTrack(localAudioTrack.getMediaStreamTrack());
                previewStream.addTrack(localVideoTrack.getMediaStreamTrack());
                set({ localStream: previewStream, isScreenSharing: false });
            } catch (error) {
                console.error("Error reverting to camera:", error);
                toast.error("Could not switch back to camera.");
            }
        } else {
            // Start screen sharing
            try {
                const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
                await client.unpublish(localVideoTrack);
                localVideoTrack?.close();

                // screenTrack can be a single track or [videoTrack, audioTrack]
                const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
                localVideoTrack = videoTrack;
                await client.publish(localVideoTrack);

                localVideoTrack.on("track-ended", () => {
                    if (get().isScreenSharing) get().toggleScreenShare();
                });

                const previewStream = new MediaStream();
                if (localAudioTrack) previewStream.addTrack(localAudioTrack.getMediaStreamTrack());
                previewStream.addTrack(localVideoTrack.getMediaStreamTrack());
                set({ localStream: previewStream, isScreenSharing: true });
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
    },
}));