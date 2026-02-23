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
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
                if (err.name !== "AbortError") console.error("Remote video play error:", err);
            });
        }
        return () => { isMounted = false; };
    }, [remoteStream]);

    // Play remote audio for audio-only calls
    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch((err) => {
                if (err.name !== "AbortError") console.error("Remote audio play error:", err);
            });
        }
    }, [remoteStream]);

    useEffect(() => {
        if (callState === "idle" || callState === "failed") {
            navigate("/");
        }
    }, [callState, navigate]);

    const handleHangup = () => {
        hangup(socket);
    };

    return (
        <div className='relative w-screen h-screen bg-[#0b141a] overflow-hidden flex flex-col text-white'>
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
                <h1 className="text-3xl font-bold leading-tight">{callee?.fullName || caller?.fullName}</h1>

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
            <div className="flex-1 relative flex items-center justify-center p-4">
                {callType === "video" && remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className='w-full h-full object-contain rounded-2xl shadow-2xl' />
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
                    <div className="absolute bottom-32 right-6 w-32 h-44 sm:w-40 sm:h-56 overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl z-20 animate-in zoom-in duration-500">
                        <video ref={localVideoRef} autoPlay playsInline muted className='w-full h-full object-cover mirror' />
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
                </div>
            </div>

            <style jsx>{`
                .mirror { transform: scaleX(-1); }
            `}</style>
        </div>
    );
};

export default CallPage;
