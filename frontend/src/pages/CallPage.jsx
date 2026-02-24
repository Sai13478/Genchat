import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { useCallStore } from '../store/useCallStore';
import { PhoneOff, ScreenShare, ScreenShareOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import useCallTimer from "../hooks/useCallTimer";
import useStreamVolume from "../hooks/useStreamVolume";

const CallPage = () => {
    const {
        localStream,
        remoteStream,
        hangup,
        callState,
        callType,
        callee,
        caller,
        toggleScreenShare,
        isScreenSharing,
        isMuted,
        toggleMute,
        isVideoEnabled,
        toggleVideo,
        getOutputDevices,
        availableOutputDevices,
        selectedOutputDeviceId,
        setAudioOutput,
    } = useCallStore();
    const { socket } = useSocket();
    const timer = useCallTimer();
    const remoteVolume = useStreamVolume(remoteStream);
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const remoteAudioRef = useRef();
    const navigate = useNavigate();

    // Visual feedback for speech: turns ring green if volume > 10
    const isSpeaking = remoteVolume > 10;

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch((err) => {
                if (err.name !== "AbortError") console.error("Local video play error:", err);
            });
        }
    }, [localStream]);

    useEffect(() => {
        let isMounted = true;
        if (remoteStream && remoteVideoRef.current) {
            console.log(`Assigning remote stream to video element. Tracks: ${remoteStream.getTracks().length}`);
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
                if (err.name !== "AbortError") console.error("Remote video play error:", err);
            });
        }
        return () => { isMounted = false; };
    }, [remoteStream]);

    // Play remote audio for audio-only calls
    useEffect(() => {
        if (remoteStream && remoteAudioRef.current && callType !== "video") {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch((err) => {
                if (err.name !== "AbortError") console.error("Remote audio play error:", err);
            });
        } else if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
    }, [remoteStream, callType]);

    // Fetch output devices on mount
    useEffect(() => {
        getOutputDevices();
    }, [getOutputDevices]);

    // Apply audio output device selection
    useEffect(() => {
        const applySinkId = async (element, deviceId) => {
            if (element && typeof element.setSinkId === 'function') {
                try {
                    await element.setSinkId(deviceId);
                    console.log(`Audio output set to ${deviceId} for ${element.tagName}`);
                } catch (error) {
                    console.error(`Error setting sink ID for ${element.tagName}:`, error);
                }
            }
        };

        if (selectedOutputDeviceId) {
            applySinkId(remoteAudioRef.current, selectedOutputDeviceId);
            applySinkId(remoteVideoRef.current, selectedOutputDeviceId);
        }
    }, [selectedOutputDeviceId]);

    useEffect(() => {
        if (callState === "idle" || callState === "failed") {
            navigate("/");
        }
    }, [callState, navigate]);

    const handleHangup = () => {
        hangup(socket);
    };

    // --- CLEANUP ON UNMOUNT ---
    // This ensures that if the user navigates away (e.g., via Navbar),
    // the camera is turned off and the other peer is notified.
    useEffect(() => {
        return () => {
            if (getCallState() !== "idle") {
                console.log("CallPage unmounting: performing cleanup.");
                hangup(socket);
            }
        };
    }, [socket, hangup]);

    // Helper to check state inside cleanup without making callState a dependency
    const getCallState = () => useCallStore.getState().callState;

    return (
        <div className='relative w-screen h-screen bg-[#0b141a] overflow-hidden flex flex-col text-white pt-16'>
            {/* Background Blur Overlay for Audio Calls */}
            {callType !== "video" && (
                <div className="absolute inset-0 opacity-20 blur-3xl scale-150 pointer-events-none">
                    <img src={callee?.profilePic || caller?.profilePic || "/avatar.png"} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Hidden audio element to play remote stream for audio calls */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Header / Info */}
            <div className="absolute top-12 left-0 right-0 z-10 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex items-center gap-2 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium uppercase tracking-[0.2em]">End-to-end encrypted</span>
                </div>
                <h1 className="text-3xl font-bold leading-tight">
                    {(callee?.username || caller?.username) || "User"}
                    <span className="text-lg opacity-50 ml-1">#{(callee?.tag || caller?.tag) || "0000"}</span>
                </h1>

                {callState === "connected" ? (
                    <div className='text-xl font-mono tracking-wider text-emerald-400'>
                        {timer}
                    </div>
                ) : (
                    <div className="text-xl text-zinc-400 animate-pulse">
                        {callState === "calling" ? "Calling..." : "Ringing..."}
                    </div>
                )}
            </div>

            {/* Remote Stream Content Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8">
                {callType === "video" && remoteStream ? (
                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden rounded-3xl bg-black/40 shadow-inner">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className='max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-700'
                        />
                    </div>
                ) : (
                    <div className='relative'>
                        <div className={`w-48 h-48 rounded-full ring-4 ring-offset-8 ring-offset-[#0b141a] transition-all duration-500 overflow-hidden shadow-2xl ${isSpeaking ? "ring-emerald-500 scale-105" : "ring-emerald-500/20"}`}>
                            <img src={callee?.profilePic || caller?.profilePic || "/avatar.png"} className="w-full h-full object-cover" />
                        </div>
                        {isSpeaking && (
                            <div className="absolute -inset-4 rounded-full border border-emerald-500/30 animate-ping" />
                        )}
                    </div>
                )}

                {/* Local Video Preview (Picture in Picture) */}
                {callType === "video" && localStream && (
                    <div className="absolute bottom-32 right-6 sm:right-10 w-32 h-44 sm:w-48 sm:h-64 overflow-hidden rounded-2xl border-2 border-white/30 shadow-2xl z-20 animate-in zoom-in slide-in-from-right duration-700 bg-black">
                        <video ref={localVideoRef} autoPlay playsInline muted className='w-full h-full object-contain video-mirror' />
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className='absolute bottom-10 left-0 right-0 px-6 z-30 flex justify-center'>
                <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] flex items-center gap-4 sm:gap-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                    <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {callType === "video" && (
                        <button
                            onClick={toggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isVideoEnabled ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                    )}

                    {callType === "video" && (
                        <button
                            onClick={toggleScreenShare}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                            {isScreenSharing ? <ScreenShareOff size={24} /> : <ScreenShare size={24} />}
                        </button>
                    )}

                    <button
                        onClick={handleHangup}
                        className='w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 text-white'
                    >
                        <PhoneOff size={28} />
                    </button>

                    {/* Output Device Selection */}
                    {availableOutputDevices.length > 0 && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full">
                            <span className="text-xs text-zinc-400 whitespace-nowrap">Output:</span>
                            <select
                                value={selectedOutputDeviceId}
                                onChange={(e) => setAudioOutput(e.target.value)}
                                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer max-w-[120px] truncate"
                            >
                                {availableOutputDevices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId} className="bg-zinc-800">
                                        {device.label || `Device ${device.deviceId.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .video-mirror { transform: scaleX(-1); }
            `}</style>
        </div>
    );
};

export default CallPage;
