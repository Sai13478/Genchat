import { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
import {
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    Maximize2,
    Minimize2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CallPage = () => {
    const {
        localStream,
        remoteStream,
        callType,
        callee,
        caller,
        hangup,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        isMuted,
        isVideoEnabled,
        isScreenSharing,
        connectionStatus,
        callStartTime,
        callState
    } = useCallStore();

    const navigate = useNavigate();
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [duration, setDuration] = useState("00:00");
    const [isFullscreen, setIsFullscreen] = useState(false);

    const otherUser = callee || caller;

    // Timer logic
    useEffect(() => {
        let interval;
        if (callStartTime && connectionStatus === "connected") {
            interval = setInterval(() => {
                const totalSeconds = Math.floor((Date.now() - callStartTime) / 1000);
                const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
                const seconds = (totalSeconds % 60).toString().padStart(2, "0");
                setDuration(`${minutes}:${seconds}`);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callStartTime, connectionStatus]);

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Handle call end
    useEffect(() => {
        if (callState === "idle" || callState === "failed") {
            navigate("/");
        }
    }, [callState, navigate]);

    const handleHangup = () => {
        hangup();
        navigate("/");
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    if (!otherUser) return null;

    return (
        <div className='fixed inset-0 bg-[#0b141a] flex flex-col items-center justify-center z-[50] overflow-hidden'>
            {/* Immersive Background (Blurred Profile Pic or Stream) */}
            <div className='absolute inset-0 z-0 opacity-20 pointer-events-none'>
                <img
                    src={otherUser?.profilePic || "/avatar.png"}
                    alt='bg'
                    className='w-full h-full object-cover blur-[100px] scale-110'
                />
            </div>

            {/* Remote View */}
            <div className='relative flex-1 w-full h-full flex items-center justify-center'>
                {callType === "video" && remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className='w-full h-full object-cover md:object-contain'
                    />
                ) : (
                    <div className='flex flex-col items-center gap-8'>
                        <div className='relative'>
                            <div className='w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl animate-pulse-subtle'>
                                <img src={otherUser?.profilePic || "/avatar.png"} alt='Avatar' className='w-full h-full object-cover' />
                            </div>
                            <div className='absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-4 py-1 rounded-full font-bold shadow-lg uppercase tracking-wider'>
                                Secure Voice
                            </div>
                        </div>
                        <div className='text-center space-y-2'>
                            <h2 className='text-4xl font-bold text-white'>{otherUser?.username}</h2>
                            <p className='text-emerald-400 font-medium tracking-widest uppercase text-sm'>
                                {connectionStatus === "connected" ? duration : connectionStatus}
                            </p>
                        </div>
                    </div>
                )}

                {/* Local View (PIP) */}
                {callType === "video" && localStream && (
                    <div className='absolute top-6 right-6 w-32 h-48 md:w-48 md:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl backdrop-blur-md transform transition-transform hover:scale-105 cursor-move'>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className='w-full h-full object-cover'
                        />
                    </div>
                )}
            </div>

            {/* Control Bar */}
            <div className='absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-8 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl z-20 animate-in slide-in-from-bottom-10 duration-500'>
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all hover:scale-110 active:scale-95 ${isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {callType === "video" && (
                    <>
                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all hover:scale-110 active:scale-95 ${!isVideoEnabled ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                            title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
                        >
                            {!isVideoEnabled ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>

                        <button
                            onClick={toggleScreenShare}
                            className={`p-4 rounded-full transition-all hover:scale-110 active:scale-95 ${isScreenSharing ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                        >
                            <MonitorUp size={24} />
                        </button>
                    </>
                )}

                <button
                    onClick={handleHangup}
                    className='p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/30'
                    title="End Call"
                >
                    <PhoneOff size={24} />
                </button>

                <div className='w-px h-8 bg-white/10 mx-2 hidden md:block'></div>

                <button
                    onClick={toggleFullscreen}
                    className='p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 hidden md:flex'
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
            </div>

            <style jsx>{`
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.02); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 4s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default CallPage;
