import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { useCallStore } from '../store/useCallStore';
import { PhoneOff, ScreenShare, ScreenShareOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import useCallTimer from "../hooks/useCallTimer";

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
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const remoteAudioRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Play remote audio for audio-only calls
    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
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
        <div className='relative w-screen h-screen bg-gray-900 flex items-center justify-center'>
            {/* Hidden audio element to play remote stream for audio calls */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Remote Stream */}
            {callType === "video" && remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className='w-full h-full object-cover' />
            ) : (
                <div className='flex flex-col items-center gap-4'>
                    <div className='avatar'>
                        <div className='w-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4'>
                            <img src={callee?.profilePic || caller?.profilePic || "/avatar.png"} />
                        </div>
                    </div>
                    <p className='text-2xl text-white'>In call with {callee?.fullName || caller?.fullName}</p>
                </div>
            )}

            {/* Timer */}
            {callState === "connected" && (
                <div className='absolute top-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-lg'>
                    {timer}
                </div>
            )}

            {/* Local Video Preview (only for video calls) */}
            {callType === "video" && localStream && (
                <video ref={localVideoRef} autoPlay playsInline muted className='absolute bottom-4 right-4 w-1/4 h-1/4 object-cover border-2 border-white rounded-lg' />
            )}

            {/* Controls */}
            <div className='absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4'>
                <button onClick={toggleMute} className='btn btn-circle'>
                    {isMuted ? <MicOff /> : <Mic />}
                </button>
                {callType === "video" && (
                    <button onClick={toggleVideo} className='btn btn-circle'>
                        {isVideoEnabled ? <Video /> : <VideoOff />}
                    </button>
                )}
                {callType === "video" && (
                    <button onClick={toggleScreenShare} className='btn btn-circle'>
                        {isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
                    </button>
                )}
                <button onClick={handleHangup} className='btn btn-circle btn-error'>
                    <PhoneOff />
                </button>
            </div>
        </div>
    );
};

export default CallPage;